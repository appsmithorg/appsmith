const { dependencies: packageDeps } = require("./package.json");
const esbuild = require("esbuild");
const fs = require("fs").promises;

// List of external workflow packages (EE only)
const externalWorkflowPackages = [];

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

/**
 * Get dependencies for workflow packages
 * @returns {Object} workflow dependencies
 */
const getWorkflowDependencies = () => {
  if (externalWorkflowPackages.length === 0) {
    return {};
  }
  return Object.entries(packageDeps).reduce((acc, [key, value]) => {
    if (externalWorkflowPackages.includes(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

const bundle = async () => {
  return esbuild
    .build({
      entryPoints: ["src/server.ts", "src/ctl/index.js"],
      bundle: true,
      sourcemap: true,
      platform: "node",
      external: [...externalWorkflowPackages, "dtrace-provider"],
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
  if (externalWorkflowPackages.length > 0) {
    // Create package.json for bundle, this is needed to install workflow dependencies
    // in the bundle directory. This is needed for EE only. This is done to support the
    // packages for our workflow provider which requires dynamic imports. ESBuild does
    // not support dynamic imports for external packages hence we need to bundle them
    // together with the workflow provider.
    const bundlePackagejson = {
      name: "rts-bundle",
      version: "1.0.0",
      description: "",
      main: "bundle/server.js",
      dependencies: getWorkflowDependencies(),
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
})();
