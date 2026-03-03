#!/usr/bin/env node

// Simple sync script to copy project docs into the Docusaurus site.
// Run from anywhere; paths are based on this script's location.

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

// Absolute paths
const scriptDir = __dirname;
const websiteDir = path.resolve(scriptDir, '..');        // .../website
const repoRoot   = path.resolve(scriptDir, '..', '..');  // repo root

const docsDir          = path.join(websiteDir, 'docs');

// Map of source -> destination files
const fileMappings = [
  {
    // Root README
    src: path.join(repoRoot, 'README.md'),
    dest: path.join(docsDir, 'README.md'),
  },
  {
    // Root CONTRIBUTING
    src: path.join(repoRoot, 'CONTRIBUTING.md'),
    dest: path.join(docsDir, 'CONTRIBUTING.md'),
  },
  {
    // test/README.md
    // Becomes /docs/test/README.md so links like "test/README.md"
    // continue to work relative to README.md.
    src: path.join(repoRoot, 'test', 'README.md'),
    dest: path.join(docsDir, 'test', 'README.md'),
  },
  {
    // doc/annotation_format_mapping.md
    // Becomes /docs/doc/annotation_format_mapping.md so links like
    // "doc/annotation_format_mapping.md" still resolve.
    src: path.join(repoRoot, 'doc', 'annotation_format_mapping.md'),
    dest: path.join(docsDir, 'doc', 'annotation_format_mapping.md'),
  },
  {
    // JSON schema used by docusaurus-json-schema-plugin
    src: path.join(repoRoot, 'doc', 'INN_antibody_schema.json'),
    dest: path.join(docsDir, 'doc', 'INN_antibody_schema.json'),
  },
];

// Helper to copy one file, creating parent dirs as needed
async function copyFileWithDirs(src, dest) {
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  await fsp.copyFile(src, dest);
  // Nice, short log for humans
  console.log(
    `Copied ${path.relative(repoRoot, src)} -> ${path.relative(websiteDir, dest)}`
  );
}

async function main() {
  try {
    // Optionally check that source files exist
    for (const { src } of fileMappings) {
      if (!fs.existsSync(src)) {
        throw new Error(`Source file not found: ${src}`);
      }
    }

    await Promise.all(
      fileMappings.map(({ src, dest }) => copyFileWithDirs(src, dest))
    );

    console.log('Doc sync complete.');
  } catch (err) {
    console.error('Doc sync failed:', err.message);
    // Non-zero exit code so CI fails if something is wrong
    process.exitCode = 1;
  }
}

main();