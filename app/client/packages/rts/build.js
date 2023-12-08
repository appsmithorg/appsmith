const esbuild = require("esbuild");
const fs = require("fs").promises;

const externalPackages = [];

async function ensureDirectoryExistence(dirname) {
  try {
    await fs.mkdir(dirname, { recursive: true });
  } catch (err) {
    if (err.code !== "EEXIST") {
      throw err;
    }
  }
}

async function createFile(dir, filename, content) {
  try {
    await ensureDirectoryExistence(dir);
    const filePath = `${dir}/${filename}`;
    await fs.writeFile(filePath, content);
  } catch (err) {
    console.error("Error writing file:", err);
  }
}

async function copyFile(source, target) {
  try {
    await fs.copyFile(source, target);
  } catch (err) {
    console.error("Error copying file:", err);
  }
}

const getTemporalioDependencies = () => {
  return {};
};

const bundle = async () => {
  return esbuild
    .build({
      entryPoints: ["src/server.ts"],
      bundle: true,
      minify: false,
      sourcemap: true,
      platform: "node",
      external: [...externalPackages, "dtrace-provider"],
      loader: {
        ".ts": "ts",
      },
      tsconfig: "tsconfig.json",
      outdir: "dist/bundle",
      target: "node" + process.versions.node,
      minify: true,
      keepNames: true,
    })
    .catch(() => process.exit(1));
};

(async () => {
  if (externalPackages.length > 0) {
    const bundlePackagejson = {
      name: "rts-bundle",
      version: "1.0.0",
      description: "",
      main: "bundle/server.js",
      dependencies: getTemporalioDependencies(),
    };

    createFile(
      "dist",
      "package.json",
      JSON.stringify(bundlePackagejson, null, 2),
    );

    console.log("Bundle package.json created successfully");
  }

  await bundle();

  console.log("Bundle created successfully");

  await copyFile(
    "src/workflowProxy/services/workflows.js",
    "dist/bundle/workflows.js",
  );
})();
