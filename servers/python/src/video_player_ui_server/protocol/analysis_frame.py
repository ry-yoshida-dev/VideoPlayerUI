"""Decoded frame handed to an analyzer."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import numpy.typing as npt


@dataclass(frozen=True)
class AnalysisFrame:
    """
    One frame of the video on the client, decoded for analysis.

    Attributes
    ----------
    time_id : int
        Time id of the frame; results are drawn on this frame.
    image : npt.NDArray[np.uint8]
        Pixels as ``(height, width, 3)`` RGB.
    """

    time_id: int
    image: npt.NDArray[np.uint8]

    @property
    def width(self) -> int:
        """Frame width in pixels."""
        return int(self.image.shape[1])

    @property
    def height(self) -> int:
        """Frame height in pixels."""
        return int(self.image.shape[0])
