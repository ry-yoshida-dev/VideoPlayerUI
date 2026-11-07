# test

## Overview

Tests of MP4 parsing, byte range reading, WebCodecs decoding and frame table resolvers, run with `node --test`.

## Components

| Component | Responsibility |
|-----------|----------------|
| [fixtures](fixtures) | Small MP4 files exercising container layouts |
| [support](support) | Test doubles standing in for browser APIs |
| [decoding.test.ts](decoding.test.ts) | `Mp4SampleTable`, `ByteRangeReader` and `SequentialFrameDecoder` tests |
| [frameTableResolver.test.ts](frameTableResolver.test.ts) | Frame table resolver tests |
