# support

## Overview

Test doubles standing in for browser APIs.

## Components

| Component | Responsibility |
|-----------|----------------|
| [FakeRangeServer.ts](FakeRangeServer.ts) | Stands in for `fetch`, serving one file with or without range support and recording what was requested |
| [FakeWebCodecs.ts](FakeWebCodecs.ts) | Stand-in for the WebCodecs `VideoDecoder`, recording released frames |
