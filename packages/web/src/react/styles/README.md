# styles

## Overview

Style sheet of the player and its injection into the document.

## Components

| Component | Responsibility |
|-----------|----------------|
| [PlayerStyles.tsx](PlayerStyles.tsx) | Injects the player's style sheet once per document, however many players render |
| [styleSheet.ts](styleSheet.ts) | Style sheet of the built-in player, themed through `--vpui-*` custom properties |
