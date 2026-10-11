"""Helpers building protocol requests in tests."""

from __future__ import annotations

import io
import json
import struct

import numpy as np
import numpy.typing as npt
from PIL import Image


class FrameEncoding:
    """Builds binary requests the way the web client does."""

    @staticmethod
    def request(image: npt.NDArray[np.uint8], request_id: int, time_id: int) -> bytes:
        """
        Encode a request carrying a PNG frame.

        Parameters
        ----------
        image : npt.NDArray[np.uint8]
            RGB pixels.
        request_id : int
            Identifier of the request.
        time_id : int
            Time id of the frame.

        Returns
        -------
        bytes
            The binary message.
        """
        buffer: io.BytesIO = io.BytesIO()
        Image.fromarray(image).save(buffer, format="PNG")
        header: bytes = json.dumps(
            {
                "type": "analyze",
                "requestId": request_id,
                "timeId": time_id,
                "mimeType": "image/png",
                "width": int(image.shape[1]),
                "height": int(image.shape[0]),
            }
        ).encode("utf-8")
        return struct.pack(">I", len(header)) + header + buffer.getvalue()

    @staticmethod
    def frame_with_box(left: int, top: int, size: int) -> npt.NDArray[np.uint8]:
        """
        Dark frame with one orange square, like the sample video.

        Parameters
        ----------
        left : int
            Left edge of the square.
        top : int
            Top edge of the square.
        size : int
            Edge length of the square.

        Returns
        -------
        npt.NDArray[np.uint8]
            A 640x360 RGB frame.
        """
        image: npt.NDArray[np.uint8] = np.full((360, 640, 3), (30, 41, 59), dtype=np.uint8)
        image[top : top + size, left : left + size] = (249, 115, 22)
        return image
