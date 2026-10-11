"""Skeleton connection between two keypoints."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class KeypointEdge:
    """
    Connection between two landmarks, given by their indices.

    Attributes
    ----------
    start : int
        Index of the first landmark.
    end : int
        Index of the second landmark.
    """

    start: int
    end: int
