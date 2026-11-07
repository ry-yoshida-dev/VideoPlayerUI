# tests

## Overview

Tests of the analysis server.

## Components

| Component | Responsibility |
|-----------|----------------|
| [support](support) | Helpers shared by the tests: request building and an overlap-recording analyzer |
| [test_protocol.py](test_protocol.py) | Request decoding, response encoding and annotation validation |
| [test_server.py](test_server.py) | End-to-end requests over a real WebSocket, including failures and the analysis limit |
