"""End-to-end tests of the analysis server over a real WebSocket."""

from __future__ import annotations

import asyncio
import json
from collections.abc import Sequence

from concurrency_probe import ConcurrencyProbe
from frame_encoding import FrameEncoding
from orange_box_detector import OrangeBoxDetector
from websockets.asyncio.client import connect

from video_player_ui_server import AnalysisFrame, AnalysisServer, AnnotationBase
from video_player_ui_server.json_value import JsonValue


class FailingAnalyzer:
    """Analyzer that always raises."""

    def analyze(self, frame: AnalysisFrame) -> Sequence[AnnotationBase]:
        raise RuntimeError(f"model not loaded for {frame.time_id}")


async def exchange(server: AnalysisServer, messages: Sequence[bytes | str]) -> list[JsonValue]:
    async with server.start() as running:
        port: int = AnalysisServer.port_of(running)
        async with connect(f"ws://localhost:{port}") as client:
            answers: list[JsonValue] = []
            for message in messages:
                await client.send(message)
                answers.append(json.loads(await client.recv()))
            return answers


def test_answers_with_detected_box() -> None:
    message: bytes = FrameEncoding.request(FrameEncoding.frame_with_box(100, 50, 40), request_id=5, time_id=42)
    [answer] = asyncio.run(exchange(AnalysisServer(OrangeBoxDetector(), port=0), [message]))
    assert answer == {
        "type": "result",
        "requestId": 5,
        "timeId": 42,
        "coordinateSpace": "pixel",
        "frameSize": {"width": 640, "height": 360},
        "annotations": [
            {
                "kind": "bounding-box",
                "box": {"x": 100, "y": 50, "width": 40, "height": 40},
                "label": "orange box",
                "score": 1.0,
                "trackId": 1,
            }
        ],
    }


def test_answers_concurrent_requests_by_request_id() -> None:
    async def run() -> list[JsonValue]:
        server: AnalysisServer = AnalysisServer(OrangeBoxDetector(delay_seconds=0.2), port=0, max_concurrent_analyses=3)
        async with server.start() as running, connect(f"ws://localhost:{AnalysisServer.port_of(running)}") as client:
            started: float = asyncio.get_running_loop().time()
            for request_id in range(3):
                frame: bytes = FrameEncoding.request(
                    FrameEncoding.frame_with_box(10 * request_id, 0, 10), request_id, request_id
                )
                await client.send(frame)
            answers: list[JsonValue] = [json.loads(await client.recv()) for _ in range(3)]
            assert asyncio.get_running_loop().time() - started < 0.5
            return answers

    answers: list[JsonValue] = asyncio.run(run())
    request_ids: list[int] = []
    for answer in answers:
        assert isinstance(answer, dict)
        request_id: JsonValue = answer["requestId"]
        assert isinstance(request_id, int)
        request_ids.append(request_id)
    assert sorted(request_ids) == [0, 1, 2]


def test_reports_failures_and_keeps_the_connection() -> None:
    good: bytes = FrameEncoding.request(FrameEncoding.frame_with_box(0, 0, 10), request_id=1, time_id=1)
    answers: list[JsonValue] = asyncio.run(exchange(AnalysisServer(FailingAnalyzer(), port=0), ["text", b"\x00", good]))
    assert answers[0] == {"type": "error", "requestId": -1, "message": "Requests must be binary messages"}
    assert isinstance(answers[1], dict) and answers[1]["type"] == "error"
    assert answers[2] == {"type": "error", "requestId": 1, "message": "RuntimeError: model not loaded for 1"}


def test_limits_analyses_across_connections() -> None:
    async def run() -> ConcurrencyProbe:
        probe: ConcurrencyProbe = ConcurrencyProbe(delay_seconds=0.1)
        server: AnalysisServer = AnalysisServer(probe, port=0)
        async with server.start() as running:
            url: str = f"ws://localhost:{AnalysisServer.port_of(running)}"
            async with connect(url) as first, connect(url) as second:
                frame: bytes = FrameEncoding.request(FrameEncoding.frame_with_box(0, 0, 10), request_id=1, time_id=1)
                await first.send(frame)
                await second.send(frame)
                await first.recv()
                await second.recv()
        return probe

    assert asyncio.run(run()).max_running_count == 1


def test_keeps_the_slot_of_a_closed_connection_until_its_analysis_ends() -> None:
    async def run() -> ConcurrencyProbe:
        probe: ConcurrencyProbe = ConcurrencyProbe(delay_seconds=0.2)
        server: AnalysisServer = AnalysisServer(probe, port=0)
        frame: bytes = FrameEncoding.request(FrameEncoding.frame_with_box(0, 0, 10), request_id=1, time_id=1)
        async with server.start() as running:
            url: str = f"ws://localhost:{AnalysisServer.port_of(running)}"
            async with connect(url) as closing:
                await closing.send(frame)
                while probe.call_count == 0:
                    await asyncio.sleep(0.01)
            async with connect(url) as client:
                await client.send(frame)
                await client.recv()
        return probe

    assert asyncio.run(run()).max_running_count == 1
