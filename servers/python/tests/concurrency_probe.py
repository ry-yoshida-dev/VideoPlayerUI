"""Analyzer recording how many calls overlap."""

from __future__ import annotations

import threading
import time
from collections.abc import Sequence

from video_player_ui_server import AnalysisFrame, AnnotationBase


class ConcurrencyProbe:
    """
    Analyzer that sleeps on every frame and records the most calls running at once.

    Parameters
    ----------
    delay_seconds : float
        Time each call takes.
    """

    def __init__(self, delay_seconds: float) -> None:
        self._delay_seconds: float = delay_seconds
        self._lock: threading.Lock = threading.Lock()
        self._running_count: int = 0
        self._call_count: int = 0
        self.max_running_count: int = 0

    @property
    def call_count(self) -> int:
        """Number of calls that started."""
        with self._lock:
            return self._call_count

    def analyze(self, frame: AnalysisFrame) -> Sequence[AnnotationBase]:
        """
        Sleep while counting overlapping calls.

        Parameters
        ----------
        frame : AnalysisFrame
            Ignored frame.

        Returns
        -------
        Sequence[AnnotationBase]
            No annotations.
        """
        with self._lock:
            self._call_count += 1
            self._running_count += 1
            self.max_running_count = max(self.max_running_count, self._running_count)
        time.sleep(self._delay_seconds)
        with self._lock:
            self._running_count -= 1
        return []
