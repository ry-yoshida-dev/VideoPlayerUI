"""JSON value type of protocol messages."""

JsonValue = None | bool | int | float | str | list["JsonValue"] | dict[str, "JsonValue"]
