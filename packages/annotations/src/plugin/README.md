# plugin

## Overview

Plugin contract of annotation kinds and the registry looking them up.

## Components

| Component | Responsibility |
|-----------|----------------|
| [builtin](builtin) | Plugins of the built-in annotation kinds. Each file implements `AnnotationPlugin` for one kind |
| [AnnotationPlugin.ts](AnnotationPlugin.ts) | Parsing, drawing and hit testing of one annotation kind |
| [AnnotationPluginRegistry.ts](AnnotationPluginRegistry.ts) | Plugins by annotation kind, consulted when parsing, drawing and hit testing |
