"""Error raised for messages that break the analysis protocol."""


class ProtocolError(ValueError):
    """Raised when a message breaks ``spec/analysis-protocol.md``."""
