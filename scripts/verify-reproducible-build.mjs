import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile, rm, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = resolve(".");
const DIST = resolve("dist");
const SNAPSHOT_1 = resolve(".p3-04-build-1.json");
const SNAPSHOT_2 = resolve(".p3-04-build-2.json");

function runBuild(label) {
  console.log(`\n=== ${label} ===`);
  execFileSync("npm", ["run", "build"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

async function collectFiles(directory) {
  const result = [];

  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = join(current, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        result.push(fullPath);
      }
    }
  }

  await walk(directory);
  return result;
}

async function sha256File(filePath) {
  const data = await readFile(filePath);
  return createHash("sha256").update(data).digest("hex");
}

async function buildManifest() {
  if (!existsSync(DIST)) {
    throw new Error("dist/ does not exist after production build.");
  }

  const files = await collectFiles(DIST);
  const manifest = [];

  for (const filePath of files) {
    const relativePath = relative(DIST, filePath).replaceAll("\\", "/");
    const fileStat = await stat(filePath);

    manifest.push({
      path: relativePath,
      size: fileStat.size,
      sha256: await sha256File(filePath),
    });
  }

  manifest.sort((a, b) => a.path.localeCompare(b.path));

  return {
    algorithm: "SHA-256",
    root: "dist",
    files: manifest,
  };
}

function compareManifests(first, second) {
  const failures = [];

  if (first.algorithm !== second.algorithm) {
    failures.push(
      `algorithm mismatch: ${first.algorithm} !== ${second.algorithm}`,
    );
  }

  const firstFiles = new Map(first.files.map((file) => [file.path, file]));
  const secondFiles = new Map(second.files.map((file) => [file.path, file]));

  const allPaths = [...new Set([...firstFiles.keys(), ...secondFiles.keys()])]
    .sort((a, b) => a.localeCompare(b));

  for (const path of allPaths) {
    const a = firstFiles.get(path);
    const b = secondFiles.get(path);

    if (!a) {
      failures.push(`extra file in build #2: ${path}`);
      continue;
    }

    if (!b) {
      failures.push(`missing file in build #2: ${path}`);
      continue;
    }

    if (a.size !== b.size) {
      failures.push(`size mismatch: ${path} (${a.size} !== ${b.size})`);
    }

    if (a.sha256 !== b.sha256) {
      failures.push(
        `SHA-256 mismatch: ${path} (${a.sha256} !== ${b.sha256})`,
      );
    }
  }

  return failures;
}

async function main() {
  console.log("==================================================");
  console.log("P3-04 — REPRODUCIBLE BUILD VERIFICATION");
  console.log("==================================================");

  await rm(SNAPSHOT_1, { force: true });
  await rm(SNAPSHOT_2, { force: true });

  runBuild("BUILD #1");

  const manifest1 = await buildManifest();
  await writeJson(SNAPSHOT_1, manifest1);

  console.log(`Build #1 artifacts: ${manifest1.files.length}`);

  runBuild("BUILD #2");

  const manifest2 = await buildManifest();
  await writeJson(SNAPSHOT_2, manifest2);

  console.log(`Build #2 artifacts: ${manifest2.files.length}`);

  const failures = compareManifests(manifest1, manifest2);

  if (failures.length > 0) {
    console.error("\nP3-04 FAIL — build artifacts are not reproducible.");
    for (const failure of failures) {
      console.error(`  ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("\nP3-04 PASS — production build artifacts are byte-for-byte reproducible.");
  console.log(`Verified ${manifest1.files.length} dist/ files using SHA-256.`);
}

async function writeJson(filePath, value) {
  const { writeFile } = await import("node:fs/promises");
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

try {
  await main();
} finally {
  await rm(SNAPSHOT_1, { force: true });
  await rm(SNAPSHOT_2, { force: true });
}
