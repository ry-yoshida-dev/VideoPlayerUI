# protocol

## Overview

Codec of `spec/analysis-protocol.md`.

## Components

| Component | Responsibility |
|-----------|----------------|
| [request_decoder.py](request_decoder.py) | Splits a binary request into header and frame, decodes the image to RGB |
| [response_encoder.py](response_encoder.py) | Builds result and error messages |
| [request_header.py](request_header.py) | Request metadata |
| [analysis_frame.py](analysis_frame.py) | Decoded frame with its time id |
| [decoded_request.py](decoded_request.py) | Header and frame of one request |
| [protocol_error.py](protocol_error.py) | Error for malformed messages |
