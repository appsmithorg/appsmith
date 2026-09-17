#!/usr/bin/env python3
"""Read Appsmith configuration as data; never evaluate shell expressions."""

import json
import io
import os
import re
import shlex
import sys


class ConfigError(ValueError):
    """Value-free configuration diagnostic."""


def valid_name(name):
    # Do not let a configuration file replace PATH, BASH_ENV, LD_PRELOAD,
    # or the shell loader's own variables.
    return bool(re.fullmatch(r"(?:APPSMITH_|MONGO_|KEYCLOAK_)[A-Za-z0-9_]+", name)) or name in {
        "HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "no_proxy",
        "NEW_RELIC_LICENSE_KEY", "NEW_RELIC_APP_NAME", "JAVA_OPTS_APPEND",
        "JGROUPS_DISCOVERY_PROTOCOL", "FILESTORE_IP_ADDRESS", "FILE_SHARE_NAME", "PORT",
    }


def parse_value(raw):
    value = []
    quote = None
    i = 0
    while i < len(raw):
        char = raw[i]
        if quote == "'":
            if char == "'":
                quote = None
            else:
                value.append(char)
        elif char == quote:
            quote = None
        elif char in "\"'" and quote is None:
            quote = char
        elif char == "\\":
            if i + 1 == len(raw):
                raise ValueError("unterminated escape")
            following = raw[i + 1]
            if quote is None or following in '\\"$`':
                i += 1
                value.append(following)
            else:
                value.append(char)
        elif quote is None and char in " \t":
            # Only unescaped whitespace terminates an assignment. Preserve spaces
            # inside quotes or consumed by the backslash branch above.
            rest = raw[i:].lstrip(" \t")
            if rest and not rest.startswith("#"):
                raise ValueError("quote values containing spaces")
            break
        elif char == "`" or (char == "$" and i + 1 < len(raw)
                             and (raw[i + 1].isalnum() or raw[i + 1] in "_{([*@#?-$!"
                                  or (quote is None and raw[i + 1] in "\"'"))) or (
                                 quote is None and char == "~" and (i == 0 or raw[i - 1] == ":")):
            raise ValueError("shell expression requires migration to a resolved literal; "
                             "single-quote intentional literal expressions")
        else:
            value.append(char)
        i += 1
    if quote is not None:
        raise ValueError("unterminated quote or escape")
    return "".join(value)


def read_env(path):
    with open(path, encoding="utf-8", newline="") as source:
        return parse_env(source)


def parse_env(source):
    values = {}
    for number, line in enumerate(source, 1):
        line = line.removesuffix("\n").removesuffix("\r")
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        try:
            name, separator, raw = line.partition("=")
            if not separator or not valid_name(name):
                raise ValueError("unsupported variable name or missing assignment")
            if any(ord(char) < 32 and char != "\t" for char in line) or "\x7f" in line:
                raise ValueError("control character")
            values[name] = parse_value(raw)
        except ValueError as error:
            # Report only a bounded identifier, never a value or malformed line.
            identifier = (
                f" ({name})" if separator and re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]{0,127}", name)
                else ""
            )
            raise ConfigError(f"line {number}{identifier}: {error}") from None
    return values


def merge_env():
    # One shared parser/serializer for backup and restore. Nothing is emitted
    # until both the original content and replacement values are valid.
    request = json.load(sys.stdin)
    if not isinstance(request, dict) or not isinstance(request.get("content"), str) or not isinstance(
        request.get("values"), dict
    ):
        raise ValueError("invalid merge request")
    values = parse_env(io.StringIO(request["content"]))
    for name, value in request["values"].items():
        if not valid_name(name) or not isinstance(value, str) or any(
            (ord(char) < 32 and char != "\t") or ord(char) == 127 for char in value
        ):
            raise ValueError("invalid persisted environment value")
        values[name] = value
    output = "".join(f"{name}={shlex.quote(value)}\n" for name, value in values.items())
    # Includes UTF-8 representability and a round trip through the reader.
    output.encode("utf-8")
    if parse_env(io.StringIO(output)) != values:
        raise ValueError("environment serialization failed")
    sys.stdout.write(output)


def main():
    mode, path = sys.argv[1:]
    if mode not in {"snapshot", "json", "env", "validate", "merge"}:
        raise ValueError("invalid mode")
    if mode == "merge":
        merge_env()
        return
    if mode == "snapshot":
        values = {key: value for key, value in os.environ.items()
                  if key.startswith(("APPSMITH_", "MONGO_"))}
        if any(not valid_name(key) for key in values):
            raise ConfigError("externally supplied environment has an unsupported variable name")
        with open(path, "w", encoding="utf-8") as target:
            json.dump(values, target)
        return
    if mode == "json":
        with open(path, encoding="utf-8") as source:
            values = json.load(source)
        if not isinstance(values, dict) or any(
            not valid_name(key) or not isinstance(value, str) or "\0" in value
            for key, value in values.items()
        ):
            raise ConfigError("invalid external environment snapshot; check container environment names and values")
    else:
        values = read_env(path)
    if mode != "validate":
        # Emit only after the entire file has passed validation.
        for key, value in values.items():
            sys.stdout.buffer.write(os.fsencode(key) + b"=" + os.fsencode(value) + b"\0")


if __name__ == "__main__":
    try:
        main()
    except ConfigError as error:
        print(f"Unable to load environment configuration: {error}.", file=sys.stderr)
        sys.exit(1)
    except (OSError, ValueError, UnicodeError):
        # json/OS exceptions can include source data; suppress their text.
        print("Unable to load environment configuration; check file syntax and permissions.", file=sys.stderr)
        sys.exit(1)
