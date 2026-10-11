"""Tests of request decoding and response encoding."""

from __future__ import annotations

import json

import numpy as np
import numpy.typing as npt
import pytest
from frame_encoding import FrameEncoding

from video_player_ui_server import (
    BoundingBox,
    DecodedRequest,
    Keypoint,
    KeypointEdge,
    Keypoints,
    Point,
    Polygon,
    ProtocolError,
    RequestDecoder,
    RequestHeader,
    ResponseEncoder,
)


def test_decodes_header_and_frame() -> None:
    image: npt.NDArray[np.uint8] = FrameEncoding.frame_with_box(100, 50, 40)
    request: DecodedRequest = RequestDecoder().decode(FrameEncoding.request(image, request_id=7, time_id=123))
    assert request.header == RequestHeader(request_id=7, time_id=123, mime_type="image/png", width=640, height=360)
    assert request.frame.time_id == 123
    assert np.array_equal(request.frame.image, image)


@pytest.mark.parametrize(
    "message",
    [
        b"\x00\x00",
        b"\x00\x00\x00\x10{}",
        b"\x00\x00\x00\x02{}",
    ],
)
def test_rejects_malformed_messages(message: bytes) -> None:
    with pytest.raises(ProtocolError):
        RequestDecoder().decode(message)


def test_rejects_size_mismatch() -> None:
    message: bytes = FrameEncoding.request(FrameEncoding.frame_with_box(0, 0, 10), request_id=1, time_id=1)
    tampered: bytes = message.replace(b'"width": 640', b'"width": 320')
    with pytest.raises(ProtocolError):
        RequestDecoder().decode(tampered)


def test_encodes_every_kind_in_pixels() -> None:
    header: RequestHeader = RequestHeader(request_id=3, time_id=9, mime_type="image/png", width=640, height=360)
    text: str = ResponseEncoder().result(
        header,
        [
            BoundingBox(x=1, y=2, width=3, height=4, label="car", score=0.5, track_id=8),
            Polygon(points=[Point(0, 0), Point(10, 0), Point(10, 10)]),
            Keypoints(points=[Keypoint(1, 1, 0.9), Keypoint(2, 2)], edges=[KeypointEdge(0, 1)]),
        ],
    )
    assert json.loads(text) == {
        "type": "result",
        "requestId": 3,
        "timeId": 9,
        "coordinateSpace": "pixel",
        "frameSize": {"width": 640, "height": 360},
        "annotations": [
            {
                "kind": "bounding-box",
                "box": {"x": 1, "y": 2, "width": 3, "height": 4},
                "label": "car",
                "score": 0.5,
                "trackId": 8,
            },
            {"kind": "polygon", "points": [{"x": 0, "y": 0}, {"x": 10, "y": 0}, {"x": 10, "y": 10}], "isClosed": True},
            {"kind": "keypoints", "points": [{"x": 1, "y": 1, "score": 0.9}, {"x": 2, "y": 2}], "edges": [[0, 1]]},
        ],
    }


def test_validates_annotations() -> None:
    with pytest.raises(ValueError):
        BoundingBox(x=0, y=0, width=-1, height=1)
    with pytest.raises(ValueError):
        BoundingBox(x=0, y=0, width=1, height=1, score=1.5)
    with pytest.raises(ValueError):
        Polygon(points=[Point(0, 0), Point(1, 1)])
    with pytest.raises(ValueError):
        Keypoints(points=[Keypoint(0, 0)], edges=[KeypointEdge(0, 1)])
