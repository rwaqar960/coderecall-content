#!/usr/bin/env bash
# Copies each course's chapters into site/docs/<course-id>/ so Docusaurus can
# build them, and derives a sidebar category label from course.json. Chapter
# front matter (id, title) doubles as Docusaurus doc front matter as-is.
#
# Runs automatically before `npm start` / `npm run build` (see package.json).
set -euo pipefail
cd "$(dirname "$0")/../.."   # site/scripts/../.. -> repo root

rm -rf site/docs
mkdir -p site/docs

count=0
for chapters_dir in courses/*/chapters; do
  [ -d "$chapters_dir" ] || continue
  course_dir=$(dirname "$chapters_dir")
  course_id=$(basename "$course_dir")
  out="site/docs/$course_id"
  mkdir -p "$out"
  cp "$chapters_dir"/*.md "$out"/

  python3 - "$course_dir/course.json" "$out/_category_.json" <<'PY'
import json, sys
course = json.load(open(sys.argv[1], encoding="utf-8-sig"))
category = {
    "label": course["title"],
    "position": 1,
    "link": {"type": "generated-index", "description": course["description"]},
}
json.dump(category, open(sys.argv[2], "w", encoding="utf-8"))
PY

  count=$((count + $(ls -1 "$chapters_dir"/*.md | wc -l)))
done

echo "Synced $count chapter(s) into site/docs/"
