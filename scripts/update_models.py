#!/usr/bin/env python3
"""Refresh models.json from Anthropic's public models overview.

Reads the "Claude API ID" and "Context window" rows of the comparison table, adds or updates
those models, and keeps every other entry (older models leave the page but stay valid).
Exits 1 when the page can't be parsed, so the workflow can report it.
"""
import datetime
import json
import re
import sys
import urllib.request

URL = "https://platform.claude.com/docs/en/about-claude/models/overview.md"
PATH = "models.json"


def cells(line):
    return [c.strip() for c in line.strip().strip("|").split("|")]


def tokens(text):
    m = re.search(r"([\d.]+)\s*([MmKk])\s*tokens", text)
    if not m:
        return None
    return int(float(m.group(1)) * (1_000_000 if m.group(2).lower() == "m" else 1_000))


def parse(markdown):
    ids, windows = None, None
    for line in markdown.splitlines():
        if not line.startswith("|"):
            continue
        row = cells(line)
        if row[0] == "Claude API ID":
            ids = [re.sub(r"[`\s]", "", c) for c in row[1:]]
        elif "Context window" in row[0] and ids and windows is None:
            windows = [tokens(c) for c in row[1:]]
    if not ids or not windows or len(ids) != len(windows):
        return {}
    return {i: w for i, w in zip(ids, windows) if i.startswith("claude-") and w}


def main():
    request = urllib.request.Request(URL, headers={"User-Agent": "portent-releases (+https://github.com/adrianfernandezalv/portent-releases)"})
    markdown = urllib.request.urlopen(request, timeout=30).read().decode()
    found = parse(markdown)
    if not found:
        print("Could not find the model table in", URL, file=sys.stderr)
        return 1

    with open(PATH) as f:
        table = json.load(f)
    entries = {e["prefix"]: e["context"] for e in table["models"]}
    changed = {p: c for p, c in found.items() if entries.get(p) != c}
    if not changed:
        print("No changes:", ", ".join(f"{p}={c}" for p, c in sorted(found.items())))
        return 0

    entries.update(changed)
    table["models"] = [{"prefix": p, "context": c} for p, c in sorted(entries.items(), key=lambda e: (-len(e[0]), e[0]))]
    table["updated"] = datetime.date.today().isoformat()
    with open(PATH, "w") as f:
        f.write(json.dumps(table, indent=2) + "\n")
    print("Updated:", ", ".join(f"{p}={c}" for p, c in sorted(changed.items())))
    return 0


if __name__ == "__main__":
    sys.exit(main())
