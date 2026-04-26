import * as esbuild from "esbuild";

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

async function build() {
  if (isWatch) {
    const contexts = await Promise.all(
      entryPoints.map((opts) => esbuild.context(opts))
    );
    await Promise.all(contexts.map((ctx) => ctx.watch()));
    console.log("👀 Watching for changes...");
  } else {
    await Promise.all(entryPoints.map((opts) => esbuild.build(opts)));
    console.log("✅ Build complete!");
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
