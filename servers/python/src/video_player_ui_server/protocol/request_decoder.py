"""Decoding of binary analysis requests."""

from __future__ import annotations

import io
import json
import struct

import numpy as np
import numpy.typing as npt
from PIL import Image

from ..json_value import JsonValue
from .analysis_frame import AnalysisFrame
from .decoded_request import DecodedRequest
from .protocol_error import ProtocolError
from .request_header import RequestHeader


class RequestDecoder:
    """Decodes the binary request messages of ``spec/analysis-protocol.md``."""

    HEADER_LENGTH_BYTES: int = 4
    SUPPORTED_MIME_TYPES: frozenset[str] = frozenset({"image/png", "image/jpeg", "image/webp"})

    def decode(self, message: bytes) -> DecodedRequest:
        """
        Decode one request.

        Parameters
        ----------
        message : bytes
            Length-prefixed JSON header followed by the encoded image.

        Returns
        -------
        DecodedRequest
            The header and the frame as RGB pixels.

        Raises
        ------
        ProtocolError
            If the message is truncated, the header is malformed or the image cannot be decoded.
        """
        if len(message) < self.HEADER_LENGTH_BYTES:
            raise ProtocolError("The message is shorter than its header length field")
        (header_length,) = struct.unpack(">I", message[: self.HEADER_LENGTH_BYTES])
        header_end: int = self.HEADER_LENGTH_BYTES + int(header_length)
        if len(message) < header_end:
            raise ProtocolError("The message ends inside its header")
        header: RequestHeader = self._decode_header(message[self.HEADER_LENGTH_BYTES : header_end])
        image: npt.NDArray[np.uint8] = self._decode_image(message[header_end:])
        if image.shape[1] != header.width or image.shape[0] != header.height:
            raise ProtocolError(
                f"The image is {image.shape[1]}x{image.shape[0]} but the header says {header.width}x{header.height}"
            )
        return DecodedRequest(header=header, frame=AnalysisFrame(time_id=header.time_id, image=image))

    def _decode_header(self, data: bytes) -> RequestHeader:
        try:
            value: JsonValue = json.loads(data.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise ProtocolError(f"The header is not UTF-8 JSON: {error}") from error
        if not isinstance(value, dict):
            raise ProtocolError("The header must be a JSON object")
        if value.get("type") != "analyze":
            raise ProtocolError(f"Unsupported request type: {value.get('type')!r}")
        mime_type: str = self._require_string(value, "mimeType")
        if mime_type not in self.SUPPORTED_MIME_TYPES:
            raise ProtocolError(f"Unsupported image type: {mime_type}")
        return RequestHeader(
            request_id=self._require_integer(value, "requestId"),
            time_id=self._require_integer(value, "timeId"),
            mime_type=mime_type,
            width=self._require_integer(value, "width"),
            height=self._require_integer(value, "height"),
        )

    def _decode_image(self, data: bytes) -> npt.NDArray[np.uint8]:
        try:
            with Image.open(io.BytesIO(data)) as image:
                return np.asarray(image.convert("RGB"), dtype=np.uint8)
        except OSError as error:
            raise ProtocolError(f"The image cannot be decoded: {error}") from error

    @staticmethod
    def _require_integer(header: dict[str, JsonValue], key: str) -> int:
        value: JsonValue = header.get(key)
        if not isinstance(value, int) or isinstance(value, bool):
            raise ProtocolError(f"Header field {key} must be an integer, given: {value!r}")
        return value

    @staticmethod
    def _require_string(header: dict[str, JsonValue], key: str) -> str:
        value: JsonValue = header.get(key)
        if not isinstance(value, str):
            raise ProtocolError(f"Header field {key} must be a string, given: {value!r}")
        return value
