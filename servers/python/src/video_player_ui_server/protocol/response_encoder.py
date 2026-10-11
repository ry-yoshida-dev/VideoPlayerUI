"""Encoding of analysis responses."""

from __future__ import annotations

import json
from collections.abc import Sequence

from ..annotation.annotation_base import AnnotationBase
from ..json_value import JsonValue
from .request_header import RequestHeader


class ResponseEncoder:
    """Encodes the text response messages of ``spec/analysis-protocol.md``."""

    def result(self, header: RequestHeader, annotations: Sequence[AnnotationBase]) -> str:
        """
        Encode the annotations of one frame.

        Parameters
        ----------
        header : RequestHeader
            Header of the request being answered.
        annotations : Sequence[AnnotationBase]
            Annotations in pixel coordinates of the frame.

        Returns
        -------
        str
            The JSON message.
        """
        message: dict[str, JsonValue] = {
            "type": "result",
            "requestId": header.request_id,
            "timeId": header.time_id,
            "coordinateSpace": "pixel",
            "frameSize": {"width": header.width, "height": header.height},
            "annotations": [annotation.to_json() for annotation in annotations],
        }
        return json.dumps(message)

    def error(self, request_id: int, message: str) -> str:
        """
        Encode a failure of one request.

        Parameters
        ----------
        request_id : int
            Identifier of the failed request, or ``-1`` when it is unknown.
        message : str
            What went wrong.

        Returns
        -------
        str
            The JSON message.
        """
        return json.dumps({"type": "error", "requestId": request_id, "message": message})
