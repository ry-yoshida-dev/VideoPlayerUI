# annotation

## Overview

Annotations an analyzer returns, in pixel coordinates; each serializes to the
format of `spec/annotation.md`.

## Components

| Component | Responsibility |
|-----------|----------------|
| [annotation_base.py](annotation_base.py) | Common fields (label, score, track id, color, attributes) and serialization |
| [bounding_box.py](bounding_box.py) | Axis-aligned box |
| [polygon.py](polygon.py) | Region outline or polyline |
| [keypoints.py](keypoints.py) | Landmarks with skeleton edges |
| [point.py](point.py) | Pixel position |
| [keypoint.py](keypoint.py) | Landmark with optional score |
| [keypoint_edge.py](keypoint_edge.py) | Skeleton connection |
