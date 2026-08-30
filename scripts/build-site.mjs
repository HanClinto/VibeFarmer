import { promises as fileSystem } from "node:fs";
import path from "node:path";

const outputDirectory = process.argv[2] ?? "_site";
const version = process.argv[3] ?? process.env.GITHUB_SHA?.slice(0, 7) ?? "dev";

async function copyDirectory(source, destination, { excludedNames = new Set() } = {}) {
  await fileSystem.mkdir(destination, { recursive: true });
  const entries = await fileSystem.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".DS_Store" || excludedNames.has(entry.name)) continue;
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath, { excludedNames });
    }
    else await fileSystem.copyFile(sourcePath, destinationPath);
  }
}

function versionHtml(source) {
  return source.replace(
    /\b(src|href)=(['"])(?!https?:|\/\/|#)([^'"?]+\.(?:js|css))(?:\?[^'"]*)?\2/g,
    (_match, attribute, quote, url) => `${attribute}=${quote}${url}?v=${version}${quote}`,
  );
}

function versionJavaScript(source) {
  return source.replace(
    /(\bfrom\s*|\bimport\s*(?:\(\s*)?)(['"])(\.{1,2}\/[^'"?]+\.js)(?:\?[^'"]*)?\2(\s*\))?/g,
    (_match, prefix, quote, url, closingParenthesis = "") => (
      `${prefix}${quote}${url}?v=${version}${quote}${closingParenthesis}`
    ),
  );
}

async function transformJavaScript(directory) {
  const entries = await fileSystem.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await transformJavaScript(entryPath);
    else if (entry.name.endsWith(".js")) {
      const source = await fileSystem.readFile(entryPath, "utf8");
      await fileSystem.writeFile(entryPath, versionJavaScript(source));
    }
  }
}

await fileSystem.rm(outputDirectory, { recursive: true, force: true });
await fileSystem.mkdir(outputDirectory, { recursive: true });

const html = await fileSystem.readFile("index.html", "utf8");
await fileSystem.writeFile(path.join(outputDirectory, "index.html"), versionHtml(html));
await copyDirectory("src", path.join(outputDirectory, "src"));
await copyDirectory("styles", path.join(outputDirectory, "styles"));
await copyDirectory(
  "node_modules/needle-rs",
  path.join(outputDirectory, "node_modules/needle-rs"),
);

try {
  await copyDirectory("assets/game", path.join(outputDirectory, "assets/game"), {
    excludedNames: new Set(["experiments"]),
  });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

await transformJavaScript(path.join(outputDirectory, "src"));
console.log(`Built ${outputDirectory} with asset version ${version}`);