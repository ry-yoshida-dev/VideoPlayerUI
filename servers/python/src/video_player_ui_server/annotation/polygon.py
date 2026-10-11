"""Region outline annotation."""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

from ..json_value import JsonValue
from .annotation_base import AnnotationBase
from .point import Point


@dataclass(frozen=True, kw_only=True)
class Polygon(AnnotationBase):
    """
    Outline of a region in pixels, or an open polyline.

    Attributes
    ----------
    points : Sequence[Point]
        Vertices; at least three.
    is_closed : bool
        Whether the last vertex connects back to the first.
    """

    points: Sequence[Point]
    is_closed: bool = True

    def __post_init__(self) -> None:
        super().__post_init__()
        if len(self.points) < 3:
            raise ValueError(f"A polygon needs at least 3 points, given: {len(self.points)}")

    @property
    def kind(self) -> str:
        return "polygon"

    def geometry_to_json(self) -> dict[str, JsonValue]:
        return {"points": [point.to_json() for point in self.points], "isClosed": self.is_closed}
