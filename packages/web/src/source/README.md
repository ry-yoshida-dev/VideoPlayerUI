# source

## Overview

Video sources and reading their bytes.

## Components

| Component | Responsibility |
|-----------|----------------|
| [ByteRangeReader.ts](ByteRangeReader.ts) | Reads byte ranges of files in memory, or of URLs by HTTP range requests with a whole-file fallback |
| [CrossOrigin.ts](CrossOrigin.ts) | How a video on another origin is requested, as the `crossorigin` attribute |
| [VideoSource.ts](VideoSource.ts) | Where a video comes from: a URL, or a file or blob in memory |
