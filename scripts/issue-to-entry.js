#!/usr/bin/env node
"use strict";

// Parses the body of a "new-scientist" GitHub issue form into a scientist
// entry JSON file under content/scientist/. Reads the issue body from the
// ISSUE_BODY environment variable so no untrusted text is interpolated into
// a shell command. Writes the entry and reports the path via GITHUB_OUTPUT.
//
// The entry is built entirely from the parsed fields here — the submitter
// never controls the output path (beyond the sanitized name) or any file
// outside content/scientist/.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content", "scientist");

// Issue-form field labels become "### <label>" headings in the issue body.
// These must match the `label:` values in
// .github/ISSUE_TEMPLATE/new-scientist.yml exactly.
const LABELS = {
  first: "First name",
  last: "Last name",
  institution: "Institution of Ph.D.",
  field: "Field of Ph.D.",
  year: "Year of Ph.D.",
  researchAreas: "Research areas",
  relevantCourses: "Relevant courses",
  relevantConcepts: "Relevant concepts",
  wikipedia: "Wikipedia URL",
  images: "Image filename(s)",
  bio: "General bio",
  kcTitles: "Key contribution titles",
  kcSummaries: "Key contribution summaries",
  citations: "Citations",
  level: "Level",
};

function parseIssueForm(body) {
  const normalized = "\n" + String(body).replace(/\r\n/g, "\n");
  const sections = normalized.split(/\n### /).slice(1);
  const fields = {};
  for (const section of sections) {
    const nl = section.indexOf("\n");
    const label = (nl === -1 ? section : section.slice(0, nl)).trim();
    let value = nl === -1 ? "" : section.slice(nl + 1).trim();
    // GitHub renders an omitted optional field as this sentinel.
    if (value === "_No response_") value = "";
    fields[label] = value;
  }
  return fields;
}

const get = (fields, key) => (fields[LABELS[key]] || "").trim();

const toLines = (value) =>
  String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

function buildEntry(fields) {
  const first = get(fields, "first");
  const last = get(fields, "last");
  const fullName = `${first} ${last}`.replace(/\s+/g, " ").trim();
  if (!first || !last) {
    throw new Error("First name and last name are both required.");
  }

  const titles = toLines(get(fields, "kcTitles"));
  const summaries = toLines(get(fields, "kcSummaries"));
  const key_contributions = titles
    .map((title, i) => ({ title, summary: summaries[i] || "" }))
    .filter((kc) => kc.title);

  const images = toLines(get(fields, "images")).map((name) =>
    name.startsWith("/") || name.startsWith("http")
      ? name
      : `/img/uploads/${name}`,
  );

  const level = get(fields, "level")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    title: fullName,
    name: fullName,
    linktitle: fullName,
    last,
    institution_of_phd: get(fields, "institution"),
    field_of_phd: get(fields, "field"),
    year_of_phd: get(fields, "year"),
    researchAreas: toLines(get(fields, "researchAreas")),
    relevantCourses: toLines(get(fields, "relevantCourses")),
    relevant_concepts: toLines(get(fields, "relevantConcepts")),
    wikipedia: get(fields, "wikipedia"),
    images,
    general_bio: get(fields, "bio"),
    key_contributions,
    citations: toLines(get(fields, "citations")),
    layout: "person",
    level,
  };
}

// Restrict the derived filename to characters seen in existing entries
// (letters, digits, spaces, and . ' -) so the submitter's name can never
// escape content/scientist/ via path separators or "..".
function safeFilename(title) {
  const cleaned = title
    .replace(/[^A-Za-z0-9 .'-]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^[.\s]+/, "")
    .trim();
  if (!cleaned) {
    throw new Error("Could not derive a valid filename from the name.");
  }
  return `${cleaned}.md`;
}

function setOutput(key, value) {
  const outFile = process.env.GITHUB_OUTPUT;
  if (outFile) {
    fs.appendFileSync(outFile, `${key}=${value}\n`);
  }
}

function main() {
  const fields = parseIssueForm(process.env.ISSUE_BODY || "");
  const entry = buildEntry(fields);
  const filename = safeFilename(entry.title);

  const target = path.resolve(CONTENT_DIR, filename);
  if (path.dirname(target) !== path.resolve(CONTENT_DIR)) {
    throw new Error("Refusing to write outside content/scientist/.");
  }

  fs.writeFileSync(target, JSON.stringify(entry, null, 2) + "\n");
  setOutput("filepath", path.relative(ROOT, target));
  setOutput("title", entry.title);
  console.log(`Wrote ${path.relative(ROOT, target)}`);
}

try {
  main();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
