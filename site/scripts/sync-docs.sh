#!/usr/bin/env bash
# Copies each course's chapters into site/docs/<course-id>/ so Docusaurus can
# build them, appends a "take the quiz" link to each (linking to the
# interactive /quiz page), and copies each chapter's quiz JSON into
# site/static/quiz-data/<course-id>/<chapter-id>.json so the quiz page can
# fetch it client-side. Chapter front matter (id, title) doubles as
# Docusaurus doc front matter as-is.
#
# Runs automatically before `npm start` / `npm run build` (see package.json).
set -euo pipefail
cd "$(dirname "$0")/../.."   # site/scripts/../.. -> repo root

rm -rf site/docs site/static/quiz-data
mkdir -p site/docs site/static/quiz-data

total=0
for course_dir in courses/*/; do
  course_dir="${course_dir%/}"
  course_id=$(basename "$course_dir")
  [ -f "$course_dir/course.json" ] || continue

  out="site/docs/$course_id"
  quiz_out="site/static/quiz-data/$course_id"
  mkdir -p "$out" "$quiz_out"

  # Position comes from this course's index in manifest.json's pack list,
  # which is the single source of truth for course order — otherwise
  # Docusaurus falls back to filesystem/alphabetical order (dsa before oop).
  n=$(python3 - "$course_dir" "$out" "$quiz_out" "$course_id" manifest.json <<'PY'
import json, sys, shutil
from urllib.parse import quote

course_dir, out, quiz_out, course_id, manifest_path = sys.argv[1:6]

course = json.load(open(f"{course_dir}/course.json", encoding="utf-8-sig"))
manifest = json.load(open(manifest_path, encoding="utf-8-sig"))
pack_ids = [p["id"] for p in manifest["packs"]]
position = pack_ids.index(course_id) + 1 if course_id in pack_ids else 999

category = {
    "label": course["title"],
    "position": position,
    # Without an explicit slug, Docusaurus puts the generated index at
    # /docs/category/<slugified-label> instead of /docs/<course_id> — pin it
    # so homepage/footer links to /docs/<course_id> actually resolve.
    "link": {
        "type": "generated-index",
        "slug": f"/{course_id}",
        "description": course["description"],
    },
}
json.dump(category, open(f"{out}/_category_.json", "w", encoding="utf-8"))

synced = 0
for chapter in course["chapters"]:
    if chapter.get("status") != "ready":
        continue
    src_chapter = f"{course_dir}/{chapter['file']}"
    dst_chapter = f"{out}/{chapter['file'].split('/')[-1]}"
    shutil.copyfile(src_chapter, dst_chapter)

    quiz_link = (
        f"/quiz?course={course_id}&chapter={chapter['id']}"
        f"&title={quote(chapter['title'])}"
    )
    with open(dst_chapter, "a", encoding="utf-8") as f:
        f.write("\n---\n\n" f"### [Take the chapter quiz →]({quiz_link})\n")

    src_quiz = f"{course_dir}/{chapter['quiz']}"
    dst_quiz = f"{quiz_out}/{chapter['id']}.json"
    shutil.copyfile(src_quiz, dst_quiz)
    synced += 1

print(synced)
PY
)
  total=$((total + n))
done

echo "Synced $total chapter(s) (docs + quiz data) into site/"
