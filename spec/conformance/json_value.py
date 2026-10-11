"""JSON value type shared by the conformance generator."""

JsonValue = (
    None | bool | int | float | str | list["JsonValue"] | dict[str, "JsonValue"]
)
