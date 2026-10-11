"""Request decoded from a binary message."""

from __future__ import annotations

from dataclasses import dataclass

from .analysis_frame import AnalysisFrame
from .request_header import RequestHeader


@dataclass(frozen=True)
class DecodedRequest:
    """
    Header and decoded frame of one request.

    Attributes
    ----------
    header : RequestHeader
        Metadata of the request.
    frame : AnalysisFrame
        The frame to analyze.
    """

    header: RequestHeader
    frame: AnalysisFrame
