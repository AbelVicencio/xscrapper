import * as esbuild from "esbuild";
import fs from "fs";
import path from "path";

const isWatch = process.argv.includes("--watch");

/** @type {esbuild.BuildOptions} */
const commonOptions = {
  bundle: true,
  sourcemap: true,
  target: "es2022",
  format: "iife",
  logLevel: "info",
};

const entryPoints = [
  {
    entryPoints: ["src/content/index.ts"],
    outfile: "dist/content.js",
    ...commonOptions,
  },
  {
    entryPoints: ["src/background/service-worker.ts"],
    outfile: "dist/service-worker.js",
    ...commonOptions,
  },
  {
    entryPoints: ["src/popup/popup.ts"],
    outfile: "dist/popup.js",
    ...commonOptions,
  },
];

function incrementVersion() {
  if (isWatch) return;

  try {
    const manifestPath = path.resolve("./manifest.json");
    const packagePath = path.resolve("./package.json");

    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      let versionParts = manifest.version.split(".");
      versionParts[versionParts.length - 1] = parseInt(versionParts[versionParts.length - 1], 10) + 1;
      manifest.version = versionParts.join(".");
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(`🔼 Version bumped to ${manifest.version}`);

      if (fs.existsSync(packagePath)) {
        const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
        pkg.version = manifest.version;
        fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
      }
    }
  } catch (err) {
    console.error("Error bumping version:", err);
  }
}

async function build() {
  if (isWatch) {
    const contexts = await Promise.all(
      entryPoints.map((opts) => esbuild.context(opts))
    );
    await Promise.all(contexts.map((ctx) => ctx.watch()));
    console.log("👀 Watching for changes...");
  } else {
    incrementVersion();
    await Promise.all(entryPoints.map((opts) => esbuild.build(opts)));
    console.log("✅ Build complete!");
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
