"""Landmark of a keypoints annotation."""

from __future__ import annotations

from dataclasses import dataclass

from ..json_value import JsonValue


@dataclass(frozen=True)
class Keypoint:
    """
    One landmark in pixels.

    Attributes
    ----------
    x : float
        Horizontal position.
    y : float
        Vertical position.
    score : float | None
        Confidence or visibility in ``[0, 1]``.
    """

    x: float
    y: float
    score: float | None = None

    def to_json(self) -> dict[str, JsonValue]:
        """
        Serialize the landmark.

        Returns
        -------
        dict[str, JsonValue]
            The position and, when set, the score.
        """
        result: dict[str, JsonValue] = {"x": self.x, "y": self.y}
        if self.score is not None:
            result["score"] = self.score
        return result
