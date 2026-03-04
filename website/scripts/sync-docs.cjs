#!/usr/bin/env node

// Simple sync script to copy project docs into the Docusaurus site.
// Run from anywhere; paths are based on this script's location.

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const {spawnSync} = require('child_process');

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
  {
    // Original INN annotation format PDF
    src: path.join(repoRoot, 'doc', 'INN_annotation_format.pdf'),
    dest: path.join(docsDir, 'doc', 'INN_annotation_format.pdf'),
  },
];

const markdownExtensions = new Set(['.md', '.mdx']);
const copiedSourcePaths = new Set(
  fileMappings.map(({src}) => path.relative(repoRoot, src).replace(/\\/g, '/')),
);

const repoSlug = getRepoSlug();
const repoBranch = getRepoBranch();
const githubBlobBase = `https://github.com/${repoSlug}/blob/${repoBranch}`;
const githubTreeBase = `https://github.com/${repoSlug}/tree/${repoBranch}`;

// Helper to copy one file, creating parent dirs as needed
async function copyFileWithDirs(src, dest) {
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  if (shouldTransform(src)) {
    const original = await fsp.readFile(src, 'utf8');
    const transformed = rewriteRelativeLinks(original, src);
    await fsp.writeFile(dest, transformed, 'utf8');
  } else {
    await fsp.copyFile(src, dest);
  }
  // Nice, short log for humans
  console.log(
    `Copied ${path.relative(repoRoot, src)} -> ${path.relative(websiteDir, dest)}`
  );
}

function shouldTransform(src) {
  return markdownExtensions.has(path.extname(src).toLowerCase());
}

function rewriteRelativeLinks(content, sourceFile) {
  const linkPattern = /(!?\[[^\]]*\])\((\.{1,2}\/[^)\s]+[^)]*)\)/g;

  return content.replace(linkPattern, (match, label, target) => {
    const rewrittenTarget = transformTarget(target, sourceFile);
    return `${label}(${rewrittenTarget})`;
  });
}

function transformTarget(target, sourceFile) {
  const hashIndex = target.indexOf('#');
  const pathPart = hashIndex === -1 ? target : target.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : target.slice(hashIndex);
  const absoluteTarget = path.resolve(path.dirname(sourceFile), pathPart);
  const repoRelativePath = path
    .relative(repoRoot, absoluteTarget)
    .replace(/\\/g, '/');

  if (repoRelativePath.startsWith('..') || copiedSourcePaths.has(repoRelativePath)) {
    return target;
  }

  let isDirectory = false;
  try {
    isDirectory = fs.statSync(absoluteTarget).isDirectory();
  } catch {
    // If the path doesn't exist locally (e.g. ignored paths), treat it as a file link.
  }

  const baseUrl = isDirectory ? githubTreeBase : githubBlobBase;
  return `${baseUrl}/${repoRelativePath}${hash}`;
}

function getRepoSlug() {
  if (process.env.GITHUB_REPOSITORY) {
    return process.env.GITHUB_REPOSITORY;
  }

  const remoteUrl = runGitCommand(['config', '--get', 'remote.origin.url']);
  if (remoteUrl) {
    const match = remoteUrl.trim().match(/github\.com[:/](.+?)(?:\.git)?$/);
    if (match) {
      return match[1];
    }
  }

  return 'greglv93/Antibody-Annotation-to-JSON';
}

function getRepoBranch() {
  if (process.env.GITHUB_REF_NAME) {
    return process.env.GITHUB_REF_NAME;
  }
  if (process.env.GITHUB_HEAD_REF) {
    return process.env.GITHUB_HEAD_REF;
  }
  const ref = process.env.GITHUB_REF;
  if (ref && ref.startsWith('refs/')) {
    return ref.split('/').slice(2).join('/');
  }

  const branch = runGitCommand(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (branch && branch.trim() !== 'HEAD') {
    return branch.trim();
  }

  return 'main';
}

function runGitCommand(args) {
  try {
    const result = spawnSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    if (result.status === 0) {
      return result.stdout.trim();
    }
  } catch {
    // Ignore failures and fall back to defaults.
  }
  return null;
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
