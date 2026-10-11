"""Header of an analysis request."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RequestHeader:
    """
    Metadata sent in front of the encoded frame.

    Attributes
    ----------
    request_id : int
        Identifier echoed in the response.
    time_id : int
        Time id of the frame.
    mime_type : str
        Encoding of the image bytes.
    width : int
        Frame width in pixels.
    height : int
        Frame height in pixels.
    """

    request_id: int
    time_id: int
    mime_type: str
    width: int
    height: int
