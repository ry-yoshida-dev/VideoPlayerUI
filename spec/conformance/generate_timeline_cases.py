"""Generate timeline conformance cases from the Python TimeSeriesIterator."""

from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

from time_series_iterator import IndexBase

from case_generator import TimelineCaseGenerator
from case_specification import TimelineCaseSpecification
from json_value import JsonValue


def main() -> None:
    """Write the conformance cases next to this script."""
    valid_specifications: list[TimelineCaseSpecification] = [
        TimelineCaseSpecification(10, IndexBase.ONE, 1, 1, 1, -1),
        TimelineCaseSpecification(10, IndexBase.ZERO, 1, 1, 0, -1),
        TimelineCaseSpecification(10, IndexBase.ONE, 1, 3, 1, -1),
        TimelineCaseSpecification(10, IndexBase.ONE, 1, 3, 2, 8),
        TimelineCaseSpecification(10, IndexBase.ZERO, 5, 1, 0, -1),
        TimelineCaseSpecification(10, IndexBase.ONE, 5, 2, 11, -1),
        TimelineCaseSpecification(10, IndexBase.ONE, 3, 2, 4, 20),
        TimelineCaseSpecification(10, IndexBase.ONE, 2, 1, 1, 100),
        TimelineCaseSpecification(1, IndexBase.ONE, 1, 1, 1, -1),
        TimelineCaseSpecification(7, IndexBase.ZERO, 4, 3, 8, 23),
        TimelineCaseSpecification(5, IndexBase.ONE, 1, 1, 9, -1),
    ]
    rejected_specifications: list[TimelineCaseSpecification] = [
        TimelineCaseSpecification(10, IndexBase.ONE, 1, 1, 0, -1),
        TimelineCaseSpecification(10, IndexBase.ONE, 5, 1, 3, -1),
        TimelineCaseSpecification(10, IndexBase.ONE, 1, 1, 1, 0),
        TimelineCaseSpecification(10, IndexBase.ONE, 1, 1, 5, 4),
        TimelineCaseSpecification(10, IndexBase.ZERO, 1, 1, 0, -2),
    ]

    valid_cases: list[JsonValue] = []
    rejected_inputs: list[JsonValue] = []
    for specification in valid_specifications:
        with tempfile.TemporaryDirectory() as directory:
            valid_cases.append(TimelineCaseGenerator(Path(directory)).generate(specification))
    with tempfile.TemporaryDirectory() as directory:
        generator: TimelineCaseGenerator = TimelineCaseGenerator(Path(directory))
        for specification in rejected_specifications:
            if not generator.is_rejected(specification):
                raise RuntimeError(f"Python accepted inputs listed as rejected: {specification}")
            rejected_inputs.append(specification.to_json())

    document: dict[str, JsonValue] = {
        "generatedBy": "spec/conformance/generate_timeline_cases.py",
        "validCases": valid_cases,
        "rejectedInputs": rejected_inputs,
    }
    output_path: Path = Path(__file__).with_name("timeline.json")
    output_path.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
    sys.stdout.write(f"Wrote {len(valid_cases)} valid and {len(rejected_inputs)} rejected cases\n")


if __name__ == "__main__":
    main()
