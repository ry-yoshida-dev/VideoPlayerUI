"""Contract of the function the server runs on each frame."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Protocol

from .annotation.annotation_base import AnnotationBase
from .protocol.analysis_frame import AnalysisFrame


class FrameAnalyzer(Protocol):
    """Turns one frame into annotations; any detector, tracker or model fits behind it."""

    def analyze(self, frame: AnalysisFrame) -> Sequence[AnnotationBase]:
        """
        Analyze one frame.

        Called on a worker thread, one frame at a time per connection.

        Parameters
        ----------
        frame : AnalysisFrame
            The frame as RGB pixels with its time id.

        Returns
        -------
        Sequence[AnnotationBase]
            Annotations in pixel coordinates of the frame.
        """
        ...
