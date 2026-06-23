import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const functionDir = path.resolve(".vercel/output/functions/__server.func");
const functionPackagePath = path.join(functionDir, "package.json");
const tslibSourcePath = path.resolve("node_modules/tslib/tslib.es6.mjs");
const tslibTargetPath = path.join(functionDir, "_libs/tslib.mjs");

if (!existsSync(functionPackagePath) || !existsSync(tslibSourcePath)) {
  process.exit(0);
}

async function listMjsFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "node_modules") {
      continue;
    }

    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listMjsFiles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith(".mjs")) {
      files.push(entryPath);
    }
  }

  return files;
}

function toImportPath(fromFile, toFile) {
  let relativePath = path.relative(path.dirname(fromFile), toFile).replaceAll(path.sep, "/");

  if (!relativePath.startsWith(".")) {
    relativePath = `./${relativePath}`;
  }

  return relativePath;
}

await mkdir(path.dirname(tslibTargetPath), { recursive: true });
await copyFile(tslibSourcePath, tslibTargetPath);

let rewrittenFiles = 0;

for (const filePath of await listMjsFiles(functionDir)) {
  const source = await readFile(filePath, "utf8");
  const tslibImportPath = toImportPath(filePath, tslibTargetPath);
  const rewritten = source
    .replaceAll('from "tslib"', `from "${tslibImportPath}"`)
    .replaceAll("from 'tslib'", `from "${tslibImportPath}"`)
    .replaceAll('import("tslib")', `import("${tslibImportPath}")`)
    .replaceAll("import('tslib')", `import("${tslibImportPath}")`);

  if (rewritten !== source) {
    await writeFile(filePath, rewritten);
    rewrittenFiles += 1;
  }
}

if (rewrittenFiles > 0) {
  console.log(`[postbuild] Inlined tslib for Vercel function (${rewrittenFiles} files).`);
}
