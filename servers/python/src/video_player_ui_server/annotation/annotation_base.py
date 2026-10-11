"""Fields shared by every annotation kind."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field

from ..json_value import JsonValue


@dataclass(frozen=True, kw_only=True)
class AnnotationBase(ABC):
    """
    Optional fields every annotation kind may carry.

    Attributes
    ----------
    label : str | None
        Class name; drives the default color in the player.
    score : float | None
        Confidence in ``[0, 1]``.
    track_id : int | str | None
        Identity across frames; takes precedence over ``label`` for color.
    color : str | None
        CSS color overriding the player's palette.
    attributes : dict[str, str | int | float | bool]
        Free-form values shown to the application.
    """

    label: str | None = None
    score: float | None = None
    track_id: int | str | None = None
    color: str | None = None
    attributes: dict[str, str | int | float | bool] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.score is not None and not 0.0 <= self.score <= 1.0:
            raise ValueError(f"score must lie in [0, 1], given: {self.score}")

    @property
    @abstractmethod
    def kind(self) -> str:
        """Kind tag of the annotation, as in ``spec/annotation.md``."""

    @abstractmethod
    def geometry_to_json(self) -> dict[str, JsonValue]:
        """
        Serialize the kind-specific geometry in pixel coordinates.

        Returns
        -------
        dict[str, JsonValue]
            The geometry fields.
        """

    def to_json(self) -> dict[str, JsonValue]:
        """
        Serialize the annotation for the analysis protocol.

        Returns
        -------
        dict[str, JsonValue]
            The annotation in pixel coordinates.
        """
        result: dict[str, JsonValue] = {"kind": self.kind, **self.geometry_to_json()}
        if self.label is not None:
            result["label"] = self.label
        if self.score is not None:
            result["score"] = self.score
        if self.track_id is not None:
            result["trackId"] = self.track_id
        if self.color is not None:
            result["color"] = self.color
        if self.attributes:
            result["attributes"] = dict(self.attributes)
        return result
