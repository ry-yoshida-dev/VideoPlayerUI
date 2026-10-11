"""Inputs of one timeline conformance case."""

from __future__ import annotations

from dataclasses import dataclass

from time_series_iterator import IndexBase

from json_value import JsonValue


@dataclass(frozen=True)
class TimelineCaseSpecification:
    """
    Inputs of one timeline case.

    Attributes
    ----------
    frame_count : int
        Number of stored frames in the media.
    index_base : IndexBase
        Time id of the first raw frame.
    pre_sampled_frequency : int
        Raw frames per stored frame.
    sampling_frequency : int
        Stored frames per sampled step.
    start_time_id : int
        First time id of the range.
    end_time_id : int
        Last time id of the range, or -1 to run to the last frame.
    """

    frame_count: int
    index_base: IndexBase
    pre_sampled_frequency: int
    sampling_frequency: int
    start_time_id: int
    end_time_id: int

    def to_json(self) -> dict[str, JsonValue]:
        """
        Serialize the inputs with the JSON field names of the specification.

        Returns
        -------
        dict[str, JsonValue]
            The inputs, with an unbounded end written as null.
        """
        return {
            "frameCount": self.frame_count,
            "indexBase": self.index_base.value,
            "preSampledFrequency": self.pre_sampled_frequency,
            "samplingFrequency": self.sampling_frequency,
            "startTimeId": self.start_time_id,
            "endTimeId": None if self.end_time_id == -1 else self.end_time_id,
        }
