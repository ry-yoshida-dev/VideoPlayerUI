"""WebSocket server answering analysis requests."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Sequence

from websockets.asyncio.server import Server, ServerConnection, serve
from websockets.exceptions import ConnectionClosed

from .annotation.annotation_base import AnnotationBase
from .frame_analyzer import FrameAnalyzer
from .protocol.analysis_frame import AnalysisFrame
from .protocol.decoded_request import DecodedRequest
from .protocol.protocol_error import ProtocolError
from .protocol.request_decoder import RequestDecoder
from .protocol.response_encoder import ResponseEncoder

LOGGER: logging.Logger = logging.getLogger(__name__)


class AnalysisServer:
    """
    Serves ``spec/analysis-protocol.md``: decodes each frame, runs the analyzer
    on a worker thread and answers with its annotations.

    Requests on one connection are handled concurrently and answered as they
    finish, so decoding, analysis and transfer overlap even when the analyzer
    runs one frame at a time.

    Parameters
    ----------
    analyzer : FrameAnalyzer
        Function run on each frame.
    host : str
        Interface to listen on.
    port : int
        Port to listen on; 0 picks a free port.
    max_message_bytes : int
        Largest request accepted, which bounds the frame size.
    max_concurrent_analyses : int
        Frames analyzed at once across all connections, counting analyses
        still running for connections that have closed. Raise it only for
        analyzers that are safe to call from several threads.
    """

    def __init__(
        self,
        analyzer: FrameAnalyzer,
        host: str = "localhost",
        port: int = 8765,
        max_message_bytes: int = 64 * 1024 * 1024,
        max_concurrent_analyses: int = 1,
    ) -> None:
        if not 0 <= port <= 65535:
            raise ValueError(f"port must be between 0 and 65535, given: {port}")
        if max_message_bytes <= 0:
            raise ValueError(f"max_message_bytes must be positive, given: {max_message_bytes}")
        if max_concurrent_analyses <= 0:
            raise ValueError(f"max_concurrent_analyses must be positive, given: {max_concurrent_analyses}")
        self._analysis_slots: asyncio.Semaphore = asyncio.Semaphore(max_concurrent_analyses)
        self._analyzer: FrameAnalyzer = analyzer
        self._host: str = host
        self._port: int = port
        self._max_message_bytes: int = max_message_bytes
        self._decoder: RequestDecoder = RequestDecoder()
        self._encoder: ResponseEncoder = ResponseEncoder()

    def run(self) -> None:
        """Serve until interrupted; blocks the calling thread."""
        asyncio.run(self.serve_forever())

    async def serve_forever(self) -> None:
        """Serve until the task is cancelled."""
        async with self.start() as server:
            LOGGER.info(
                "Analysis server listening on %s", ", ".join(str(socket.getsockname()) for socket in server.sockets)
            )
            await server.serve_forever()

    def start(self) -> Server:
        """
        Create the listening server without blocking.

        Returns
        -------
        Server
            Server to enter with ``async with``; it listens until the block exits.
        """
        return serve(self._handle, self._host, self._port, max_size=self._max_message_bytes)

    @staticmethod
    def port_of(server: Server) -> int:
        """
        Port a running server listens on, as after starting on port 0.

        Parameters
        ----------
        server : Server
            The running server.

        Returns
        -------
        int
            The port.

        Raises
        ------
        RuntimeError
            If the server has no listening socket.
        """
        for socket in server.sockets:
            return int(socket.getsockname()[1])
        raise RuntimeError("The server has no listening socket")

    async def _handle(self, connection: ServerConnection) -> None:
        responses: set[asyncio.Task[None]] = set()
        try:
            async for message in connection:
                response: asyncio.Task[None] = asyncio.create_task(self._respond(connection, message))
                responses.add(response)
                response.add_done_callback(responses.discard)
        except ConnectionClosed:
            return
        finally:
            for response in responses:
                response.cancel()

    async def _respond(self, connection: ServerConnection, message: str | bytes) -> None:
        answer: str = await self._answer(message)
        try:
            await connection.send(answer)
        except ConnectionClosed:
            return

    async def _analyze(self, frame: AnalysisFrame) -> Sequence[AnnotationBase]:
        await self._analysis_slots.acquire()
        analysis: asyncio.Future[Sequence[AnnotationBase]] = asyncio.ensure_future(
            asyncio.to_thread(self._analyzer.analyze, frame)
        )
        analysis.add_done_callback(self._release_analysis_slot)
        return await asyncio.shield(analysis)

    def _release_analysis_slot(self, analysis: asyncio.Future[Sequence[AnnotationBase]]) -> None:
        self._analysis_slots.release()
        if not analysis.cancelled():
            analysis.exception()

    async def _answer(self, message: str | bytes) -> str:
        if isinstance(message, str):
            return self._encoder.error(-1, "Requests must be binary messages")
        try:
            request: DecodedRequest = await asyncio.to_thread(self._decoder.decode, message)
        except ProtocolError as error:
            return self._encoder.error(-1, str(error))
        try:
            annotations: Sequence[AnnotationBase] = await self._analyze(request.frame)
        except Exception as error:
            LOGGER.exception("Analyzer failed on time id %d", request.header.time_id)
            return self._encoder.error(request.header.request_id, f"{type(error).__name__}: {error}")
        return self._encoder.result(request.header, annotations)
