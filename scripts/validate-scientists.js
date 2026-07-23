#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content", "scientist");
const UPLOADS_DIR = path.join(ROOT, "static", "img", "uploads");

const VALID_LEVELS = ["K12", "UGLD", "UGUD", "G"];
const REQUIRED_STRINGS = ["title", "name", "last"];
const REQUIRED_STRING_ARRAYS = [
  "researchAreas",
  "relevantCourses",
  "citations",
  "level",
  "images",
];
const OPTIONAL_STRING_ARRAYS = ["relevant_concepts"];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateEntry(data) {
  const errors = [];

  if (data.layout !== "person") {
    errors.push(
      `"layout" must be "person", got ${JSON.stringify(data.layout)}`,
    );
  }

  for (const field of REQUIRED_STRINGS) {
    if (!isNonEmptyString(data[field])) {
      errors.push(`"${field}" is required and must be a non-empty string`);
    }
  }

  for (const field of REQUIRED_STRING_ARRAYS) {
    if (!Array.isArray(data[field])) {
      errors.push(`"${field}" is required and must be an array`);
    } else if (data[field].some((v) => typeof v !== "string")) {
      errors.push(`"${field}" must only contain strings`);
    }
  }

  for (const field of OPTIONAL_STRING_ARRAYS) {
    if (field in data) {
      if (!Array.isArray(data[field])) {
        errors.push(`"${field}" must be an array if present`);
      } else if (data[field].some((v) => typeof v !== "string")) {
        errors.push(`"${field}" must only contain strings`);
      }
    }
  }

  if (Array.isArray(data.level)) {
    for (const lvl of data.level) {
      if (!VALID_LEVELS.includes(lvl)) {
        errors.push(
          `"level" contains ${JSON.stringify(lvl)}; must be one of ${VALID_LEVELS.join(", ")}`,
        );
      }
    }
  }

  if (data.key_contributions !== undefined) {
    const kc = data.key_contributions;
    if (!Array.isArray(kc)) {
      errors.push(
        `"key_contributions" must be a list of { title, summary } objects`,
      );
    } else {
      kc.forEach((entry, index) => {
        if (
          typeof entry !== "object" ||
          entry === null ||
          Array.isArray(entry)
        ) {
          errors.push(`"key_contributions[${index}]" must be an object`);
          return;
        }
        if (!isNonEmptyString(entry.title)) {
          errors.push(
            `"key_contributions[${index}].title" must be a non-empty string`,
          );
        }
        if (typeof entry.summary !== "string") {
          errors.push(`"key_contributions[${index}].summary" must be a string`);
        }
      });
    }
  }

  if (Array.isArray(data.images)) {
    for (const img of data.images) {
      if (typeof img !== "string") continue;
      if (img.startsWith("/img/uploads/")) {
        const uploaded = path.join(
          UPLOADS_DIR,
          img.slice("/img/uploads/".length),
        );
        if (!fs.existsSync(uploaded)) {
          errors.push(
            `image "${img}" is referenced but does not exist at static/img/uploads/`,
          );
        }
      } else if (!img.startsWith("http")) {
        errors.push(
          `image "${img}" should start with "/img/uploads/" or "http"`,
        );
      }
    }
  }

  return errors;
}

function validateFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return [`invalid JSON: ${e.message}`];
  }
  return validateEntry(data);
}

function allEntryFiles() {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => path.join(CONTENT_DIR, f));
}

function entryFilesFromList(list) {
  return list
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean)
    .filter(
      (f) =>
        f.startsWith("content/scientist/") &&
        f.endsWith(".md") &&
        !path.basename(f).startsWith("_"),
    )
    .map((f) => path.join(ROOT, f))
    .filter((f) => fs.existsSync(f));
}

function main() {
  const arg = process.argv[2];
  const files =
    !arg || arg === "--all" ? allEntryFiles() : entryFilesFromList(arg);

  if (files.length === 0) {
    console.log("No scientist entries to validate.");
    return;
  }

  let hasErrors = false;
  for (const file of files) {
    const relPath = path.relative(ROOT, file);
    const errors = validateFile(file);
    if (errors.length > 0) {
      hasErrors = true;
      for (const err of errors) {
        console.log(`::error file=${relPath}::${err}`);
      }
    } else {
      console.log(`ok: ${relPath}`);
    }
  }

  if (hasErrors) {
    process.exitCode = 1;
  }
}

main();
