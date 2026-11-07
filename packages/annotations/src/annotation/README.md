# annotation

## Overview

Annotation types of `spec/annotation.md` and the parser of annotation documents.

## Components

| Component | Responsibility |
|-----------|----------------|
| [AnnotationBase.ts](AnnotationBase.ts) | Shape shared by every annotation: a kind tag and the common fields |
| [AnnotationCommonFields.ts](AnnotationCommonFields.ts) | Optional fields every annotation kind may carry |
| [AnnotationDocument.ts](AnnotationDocument.ts) | Parsed annotation document, with coordinates normalized |
| [AnnotationDocumentParser.ts](AnnotationDocumentParser.ts) | Validates annotation documents and builds their annotations through the registered plugins |
| [AnnotationFormatError.ts](AnnotationFormatError.ts) | Raised when annotation data breaks the format of `spec/annotation.md` |
| [AnnotationKind.ts](AnnotationKind.ts) | Kinds of annotation drawn by the built-in plugins |
| [AnnotationParseContext.ts](AnnotationParseContext.ts) | Document-level settings and shared readers handed to annotation plugins while parsing |
| [AnnotationTypeMap.ts](AnnotationTypeMap.ts) | Annotation type of every kind, keyed by kind tag |
| [AttributeValue.ts](AttributeValue.ts) | Value of a free-form annotation attribute |
| [BoundingBoxAnnotation.ts](BoundingBoxAnnotation.ts) | Axis-aligned box around an object |
| [CoordinateSpace.ts](CoordinateSpace.ts) | Unit of the coordinates in an annotation document |
| [JsonObjectReader.ts](JsonObjectReader.ts) | Typed, path-aware access to the fields of one JSON object |
| [Keypoint.ts](Keypoint.ts) | One landmark of a `KeypointsAnnotation` |
| [KeypointEdge.ts](KeypointEdge.ts) | Connection between two keypoints, given by their indices |
| [KeypointsAnnotation.ts](KeypointsAnnotation.ts) | Landmarks of one object, optionally joined into a skeleton |
| [PolygonAnnotation.ts](PolygonAnnotation.ts) | Outline of a region, or an open polyline |
| [TrackId.ts](TrackId.ts) | Identity of an object across frames |
