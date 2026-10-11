# conformance

## Overview

Timeline test cases recorded from the Python
[TimeSeriesIterator](https://github.com/ry-yoshida-dev/TimeSeriesIterator), so
every implementation resolves time ids exactly as the Python pipeline does.
`packages/core/test/timeline.test.ts` runs them.

## Components

| Component | Responsibility |
|-----------|----------------|
| [generate_timeline_cases.py](generate_timeline_cases.py) | Entry point writing `timeline.json` |
| [case_generator.py](case_generator.py) | Runs the Python iterator over placeholder images and records its time ids |
| [case_specification.py](case_specification.py) | Inputs of one case and their JSON form |
| [json_value.py](json_value.py) | JSON value type |
| [timeline.json](timeline.json) | Generated valid cases and rejected inputs |

## Examples

Regenerate after changing the cases, from an environment with
`time_series_iterator` installed:

```bash
python generate_timeline_cases.py
```
