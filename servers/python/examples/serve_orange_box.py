"""Serve the orange box detector for the web example."""

from __future__ import annotations

import argparse
import logging

from orange_box_detector import OrangeBoxDetector

from video_player_ui_server import AnalysisServer


def main() -> None:
    """Parse the command line and serve until interrupted."""
    parser: argparse.ArgumentParser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--delay", type=float, default=0.05, help="artificial inference time per frame in seconds")
    parser.add_argument("--concurrency", type=int, default=3, help="frames analyzed at once per connection")
    arguments: argparse.Namespace = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    AnalysisServer(
        OrangeBoxDetector(delay_seconds=arguments.delay),
        host=arguments.host,
        port=arguments.port,
        max_concurrent_analyses=arguments.concurrency,
    ).run()


if __name__ == "__main__":
    main()
