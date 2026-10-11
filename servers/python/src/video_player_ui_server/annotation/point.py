"""Pixel position."""

from __future__ import annotations

from dataclasses import dataclass

from ..json_value import JsonValue


@dataclass(frozen=True)
class Point:
    """
    Position in pixels, ``x`` to the right and ``y`` down from the top-left corner.

    Attributes
    ----------
    x : float
        Horizontal position.
    y : float
        Vertical position.
    """

    x: float
    y: float

    def to_json(self) -> dict[str, JsonValue]:
        """
        Serialize the point.

        Returns
        -------
        dict[str, JsonValue]
            The ``x`` and ``y`` fields.
        """
        return {"x": self.x, "y": self.y}
