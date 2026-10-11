"""Record how the Python iterator resolves time ids."""

from __future__ import annotations

from pathlib import Path

from time_series_iterator import (
    MediaType,
    TimeSeriesIterationParameters,
    TimeSeriesIterator,
)

from case_specification import TimelineCaseSpecification
from json_value import JsonValue


class TimelineCaseGenerator:
    """
    Record how the Python iterator resolves time ids for a set of inputs.

    Parameters
    ----------
    work_directory : Path
        Directory for the placeholder image files the iterator requires.
    """

    def __init__(self, work_directory: Path) -> None:
        self._work_directory: Path = work_directory

    def generate(self, specification: TimelineCaseSpecification) -> dict[str, JsonValue]:
        """
        Build one valid case, including the ids the iterator rejects.

        Parameters
        ----------
        specification : TimelineCaseSpecification
            The inputs of the case.

        Returns
        -------
        dict[str, JsonValue]
            The inputs together with the values the iterator produced.
        """
        iterator: TimeSeriesIterator = self._build_iterator(specification)
        sampled_step_count: int = iterator.remaining_step_count
        sampled_time_ids: list[JsonValue] = []
        is_exhausted: bool = False
        while not is_exhausted:
            try:
                sampled_time_ids.append(iterator.skip())
            except StopIteration:
                is_exhausted = True

        media_last_time_id: int = iterator.end_time_id
        media_indices: list[JsonValue] = []
        rejected_time_ids: list[JsonValue] = []
        lowest_probe: int = specification.index_base.value - 2
        highest_probe: int = media_last_time_id + specification.pre_sampled_frequency + 1
        for time_id in range(lowest_probe, highest_probe + 1):
            try:
                media_indices.append(
                    {"timeId": time_id, "mediaIndex": iterator.media_index_of(time_id)}
                )
            except ValueError:
                rejected_time_ids.append(time_id)

        return {
            "input": specification.to_json(),
            "expected": {
                "mediaLastTimeId": media_last_time_id,
                "sampledStepCount": sampled_step_count,
                "sampledTimeIds": sampled_time_ids,
                "mediaIndices": media_indices,
                "rejectedTimeIds": rejected_time_ids,
            },
        }

    def is_rejected(self, specification: TimelineCaseSpecification) -> bool:
        """
        Check whether the Python parameters reject the inputs.

        Parameters
        ----------
        specification : TimelineCaseSpecification
            The inputs to validate.

        Returns
        -------
        bool
            True when building the parameters raises ValueError.
        """
        try:
            self._build_parameters(specification)
        except ValueError:
            return True
        return False

    def _build_parameters(
        self, specification: TimelineCaseSpecification
    ) -> TimeSeriesIterationParameters:
        return TimeSeriesIterationParameters(
            pre_sampled_freq=specification.pre_sampled_frequency,
            sampling_freq=specification.sampling_frequency,
            index_base=specification.index_base,
            start_time_id=specification.start_time_id,
            end_time_id=specification.end_time_id,
        )

    def _build_iterator(self, specification: TimelineCaseSpecification) -> TimeSeriesIterator:
        paths: list[str] = []
        for frame_index in range(specification.frame_count):
            path: Path = self._work_directory / f"frame_{frame_index:05d}.png"
            path.touch()
            paths.append(str(path))
        return TimeSeriesIterator.build(
            media_type=MediaType.IMAGE,
            paths=paths,
            parameters=self._build_parameters(specification),
        )
