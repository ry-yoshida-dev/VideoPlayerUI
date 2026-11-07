# decoding

## Overview

MP4 structure parsing without the media data, and exact frame-by-frame WebCodecs decoding.

## Components

| Component | Responsibility |
|-----------|----------------|
| [DecodedFrame.ts](DecodedFrame.ts) | Frame produced by `SequentialFrameDecoder`; the receiver must close `frame` |
| [Mp4BoxHeader.ts](Mp4BoxHeader.ts) | Header of a top-level MP4 box |
| [Mp4Metadata.ts](Mp4Metadata.ts) | Parsed structure of an MP4 file: its boxes, with the media data skipped |
| [Mp4MetadataReader.ts](Mp4MetadataReader.ts) | Parses the structure of an MP4 or MOV file without downloading its media |
| [Mp4Sample.ts](Mp4Sample.ts) | One video sample of an MP4 file, with its place in decode and presentation order |
| [Mp4SampleTable.ts](Mp4SampleTable.ts) | Sample table of the first video track of an MP4 or MOV file, fragmented or not |
| [SequentialFrameDecoder.ts](SequentialFrameDecoder.ts) | Decodes an MP4 video track with WebCodecs, frame by frame in presentation order |
