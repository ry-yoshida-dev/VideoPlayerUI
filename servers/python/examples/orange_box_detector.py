"""Color-threshold detector for the generated sample video."""

from __future__ import annotations

import time
from collections.abc import Sequence

import numpy as np
import numpy.typing as npt

from video_player_ui_server import AnalysisFrame, AnnotationBase, BoundingBox


class OrangeBoxDetector:
    """
    Finds the orange box of ``examples/web/public/sample/sample.mp4``.

    Stands in for a real model: it answers with one bounding box per frame,
    optionally after a delay that imitates inference time.

    Parameters
    ----------
    delay_seconds : float
        Artificial inference time per frame.
    """

    MINIMUM_PIXELS: int = 20

    def __init__(self, delay_seconds: float = 0.0) -> None:
        if delay_seconds < 0:
            raise ValueError(f"delay_seconds must not be negative, given: {delay_seconds}")
        self._delay_seconds: float = delay_seconds

    def analyze(self, frame: AnalysisFrame) -> Sequence[AnnotationBase]:
        """
        Locate the orange box.

        Parameters
        ----------
        frame : AnalysisFrame
            Frame as RGB pixels.

        Returns
        -------
        Sequence[AnnotationBase]
            One box around the orange pixels, or nothing when too few are found.
        """
        if self._delay_seconds > 0:
            time.sleep(self._delay_seconds)
        pixels: npt.NDArray[np.int16] = frame.image.astype(np.int16)
        is_orange: npt.NDArray[np.bool_] = (
            (pixels[:, :, 0] > 200) & (pixels[:, :, 1] > 80) & (pixels[:, :, 1] < 160) & (pixels[:, :, 2] < 80)
        )
        rows, columns = np.nonzero(is_orange)
        if rows.size < self.MINIMUM_PIXELS:
            return []
        left: int = int(columns.min())
        top: int = int(rows.min())
        return [
            BoundingBox(
                x=left,
                y=top,
                width=int(columns.max()) - left + 1,
                height=int(rows.max()) - top + 1,
                label="orange box",
                score=round(float(rows.size) / float((int(columns.max()) - left + 1) * (int(rows.max()) - top + 1)), 3),
                track_id=1,
            )
        ]
