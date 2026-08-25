import json
import os
import re
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

# type -> list of level names (case-insensitive, spaces/underscores/case ignored for matching)
ASSIGNMENTS = {
    "ship": [
        "fried IEgg",
        "Kingdoms Paradise",
        "lord of ship",
        "upper flying",
    ],
    "ball": [
        "Job Application",
        "acid consistency",
    ],
    "cube": [
        "The Second Variant",
        "Jumps of John",
        "Sakupen Cube",
        "CHAOZ FANTASY",
        "jumps mastery",
        "Hypercube",
        "Show me your heart",
    ],
    "robot": [
        "kocmoc cutter",
    ],
    "wave": [
        "final flight",
        "abomination startpos",
        "abomination",
        "gods word",
        "nxise challenge ii",
        "redux",
        "Cyroze",
        "10 SECONDS",
        "jj dolphin",
        "yDigtfdttlec",
        "Auditory fixer",
        "Entombed",
        "DIOOZ SUCKS",
        "D3structi0n",
        "K55 fps",
        "DIOOZ",
        "tueml pilled",
        "kahoot stage 1",
        "Challenge for the ve",
        "BILLY NOT REALLY",
        "champignons potato",
        "Tomate",
        "AK21 Powder",
        "Bloody Roots",
        "pureL apology",
        "tueml cereal",
        "crystency",
        "Activate Brain",
        "cornification",
        "GAMBLING",
        "Wasureta",
        "Fourty",
        "WHY THE LONG FACE",
        "easter chariot",
        "Nice Challenge",
        "The Level",
        "night",
        "Kitty Chamber",
        "Auditory Breaker",
        "fuclk CHALLENGE",
        "wacky sticks",
        "TURN BRAIN ON",
        "heliopolis but 67",
        "consistency god",
        "Claustrophobe Cavern",
        "the pickled onion",
        "MiracLES",
        "IrREGUlate m0menTUM",
        "Geo",
        "santa barbara",
        "monsters",
    ],
}

def normalize(s):
    """Normalize string for comparison: lowercase, remove all non-alphanumeric."""
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())

# Build lookup key: normalized_name -> type
LOOKUP = {}
for t, names in ASSIGNMENTS.items():
    for n in names:
        key = normalize(n)
        if key:
            LOOKUP[key] = t

updated = []
skipped = []
errors = []

for json_file in sorted(DATA_DIR.glob("*.json")):
    if json_file.name.startswith("_"):
        continue
    try:
        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        level_name = data.get("name", "")
        key = normalize(level_name)
        if key in LOOKUP:
            assigned_type = LOOKUP[key]
            prev = data.get("type")
            data["type"] = assigned_type
            with open(json_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
            updated.append(f"{json_file.name}: {level_name!r} -> {assigned_type}" + (f" (was {prev})" if prev else ""))
        else:
            skipped.append(f"{json_file.name}: {level_name!r}")
    except Exception as e:
        errors.append(f"{json_file.name}: {e}")

print("=== UPDATED ===")
for line in updated:
    print(" ", line)
print(f"\nTotal updated: {len(updated)}")
print(f"\nTotal skipped (not in list): {len(skipped)}")
if errors:
    print(f"\n=== ERRORS ({len(errors)}) ===")
    for line in errors:
        print(" ", line)

# Report any names from ASSIGNMENTS that we could NOT match
matched_keys = set()
for json_file in sorted(DATA_DIR.glob("*.json")):
    if json_file.name.startswith("_"):
        continue
    try:
        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        key = normalize(data.get("name", ""))
        if key in LOOKUP:
            matched_keys.add(key)
    except Exception:
        pass

unmatched = []
for t, names in ASSIGNMENTS.items():
    for n in names:
        if normalize(n) not in matched_keys:
            unmatched.append(f"[{t}] {n!r}")
if unmatched:
    print(f"\n=== COULD NOT MATCH ({len(unmatched)}) ===")
    for line in unmatched:
        print(" ", line)
