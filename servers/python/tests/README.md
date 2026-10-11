# tests

## Overview

Tests of the analysis server.

## Components

| Component | Responsibility |
|-----------|----------------|
| [test_protocol.py](test_protocol.py) | Request decoding, response encoding and annotation validation |
| [test_server.py](test_server.py) | End-to-end requests over a real WebSocket, including failures and the analysis limit |
| [frame_encoding.py](frame_encoding.py) | Builds requests the way the web client does |
| [concurrency_probe.py](concurrency_probe.py) | Analyzer recording how many calls overlap |
