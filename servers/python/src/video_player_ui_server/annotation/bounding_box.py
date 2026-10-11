"""Axis-aligned box annotation."""

from __future__ import annotations

from dataclasses import dataclass

from ..json_value import JsonValue
from .annotation_base import AnnotationBase


@dataclass(frozen=True, kw_only=True)
class BoundingBox(AnnotationBase):
    """
    Axis-aligned box in pixels.

    Attributes
    ----------
    x : float
        Left edge.
    y : float
        Top edge.
    width : float
        Width; not negative.
    height : float
        Height; not negative.
    """

    x: float
    y: float
    width: float
    height: float

    def __post_init__(self) -> None:
        super().__post_init__()
        if self.width < 0 or self.height < 0:
            raise ValueError(f"width and height must not be negative, given: {self.width}x{self.height}")

    @property
    def kind(self) -> str:
        return "bounding-box"

    def geometry_to_json(self) -> dict[str, JsonValue]:
        return {"box": {"x": self.x, "y": self.y, "width": self.width, "height": self.height}}
