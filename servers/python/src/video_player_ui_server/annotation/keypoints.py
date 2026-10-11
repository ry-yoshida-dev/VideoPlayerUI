"""Landmarks annotation."""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass, field

from ..json_value import JsonValue
from .annotation_base import AnnotationBase
from .keypoint import Keypoint
from .keypoint_edge import KeypointEdge


@dataclass(frozen=True, kw_only=True)
class Keypoints(AnnotationBase):
    """
    Landmarks of one object in pixels, optionally joined into a skeleton.

    Attributes
    ----------
    points : Sequence[Keypoint]
        Landmarks.
    edges : Sequence[KeypointEdge]
        Skeleton connections between landmarks.
    """

    points: Sequence[Keypoint]
    edges: Sequence[KeypointEdge] = field(default_factory=tuple)

    def __post_init__(self) -> None:
        super().__post_init__()
        for edge in self.edges:
            for index in (edge.start, edge.end):
                if not 0 <= index < len(self.points):
                    raise ValueError(f"edge index {index} is outside the {len(self.points)} points")

    @property
    def kind(self) -> str:
        return "keypoints"

    def geometry_to_json(self) -> dict[str, JsonValue]:
        return {
            "points": [point.to_json() for point in self.points],
            "edges": [[edge.start, edge.end] for edge in self.edges],
        }
