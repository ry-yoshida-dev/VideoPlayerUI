# time-notation

## Overview

Text forms of time: clock text formatting, and parsing of typed time ids and times.

## Components

| Component | Responsibility |
|-----------|----------------|
| [SeekInputParser.ts](SeekInputParser.ts) | Reads seek positions typed into the time id field |
| [SeekTarget.ts](SeekTarget.ts) | Parsed seek position typed by the user |
| [SeekTargetKind.ts](SeekTargetKind.ts) | What a typed seek position refers to |
| [TimeFormatter.ts](TimeFormatter.ts) | Formats durations as clock text such as `1:05.250` or `1:02:05.250` |
