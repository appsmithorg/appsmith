/* eslint-disable no-console */
import globby from "globby";
import minimatch from "minimatch";
import { exec } from "child_process";

const fs = require("fs/promises");

type GetEnvOptions = {
  required?: boolean;
};

// used to roughly determine how many tests are in a file
const testPattern = /(^|\s)(it)\(/g;

// This function will get all the spec paths using the pattern
async function getSpecFilePaths(
  specPattern: any,
  ignoreTestFiles: any,
): Promise<string[]> {
  const files = globby.sync(specPattern, {
    ignore: ignoreTestFiles,
  });

  // ignore the files that doesn't match
  const ignorePatterns = [...(ignoreTestFiles || [])];

  // a function which returns true if the file does NOT match
  const doesNotMatchAllIgnoredPatterns = (file: string) => {
    // using {dot: true} here so that folders with a '.' in them are matched
    const MINIMATCH_OPTIONS = { dot: true, matchBase: true };
    return ignorePatterns.every((pattern) => {
      return !minimatch(file, pattern, MINIMATCH_OPTIONS);
    });
  };
  const filtered = files.filter(doesNotMatchAllIgnoredPatterns);
  return filtered;
}

// This function will determine the test counts in each file to sort it further
async function getTestCount(filePath: string): Promise<number> {
  const content = await fs.readFile(filePath, "utf8");
  return content.match(testPattern)?.length || 0;
}

// Sorting the spec files as per the test count in it
async function sortSpecFilesByTestCount(
  specPathsOriginal: string[],
): Promise<string[]> {
  const specPaths = [...specPathsOriginal];

  const testPerSpec: Record<string, number> = {};

  for (const specPath of specPaths) {
    testPerSpec[specPath] = await getTestCount(specPath);
  }

  return (
    Object.entries(testPerSpec)
      // Sort by the number of tests per spec file. And this will create a consistent file list/ordering so that file division proper.
      .sort((a, b) => b[1] - a[1])
      .map((x) => x[0])
  );
}

// This function will split the specs between the runners by calculating the modulus between spec index and the totalRunners
function splitSpecs(
  specs: string[],
  totalRunnersCount: number,
  currentRunner: number,
): string[] {
  let specs_to_run = specs.filter((_, index) => {
    return index % totalRunnersCount === currentRunner;
  });
  return specs_to_run;
}

// This function will finally get the specs as a comma separated string to pass the specs to the command
async function getSpecsToRun(
  totalRunnersCount = 0,
  currentRunner = 0,
  specPattern: string | string[] = "cypress/e2e/**/**/*.{js,ts}",
  ignorePattern: string | string[],
): Promise<string[]> {
  try {
    const specFilePaths = await sortSpecFilesByTestCount(
      await getSpecFilePaths(specPattern, ignorePattern),
    );

    if (!specFilePaths.length) {
      throw Error("No spec files found.");
    }
    const specsToRun = splitSpecs(
      specFilePaths,
      totalRunnersCount,
      currentRunner,
    );
    return specsToRun;
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// This function will help to get and convert the env variables
function getEnvNumber(
  varName: string,
  { required = false }: GetEnvOptions = {},
): number {
  if (required && process.env[varName] === undefined) {
    throw Error(`${varName} is not set.`);
  }
  const value = Number(process.env[varName]);
  if (isNaN(value)) {
    throw Error(`${varName} is not a number.`);
  }
  return value;
}

// This function will helps to check and get env variables
function getEnvValue(
  varName: string,
  { required = false }: GetEnvOptions = {},
) {
  if (required && process.env[varName] === undefined) {
    throw Error(`${varName} is not set.`);
  }
  const value = process.env[varName] === undefined ? "" : process.env[varName];
  return value;
}

// This is to fetch the env variables from CI
function getArgs() {
  return {
    totalRunners: getEnvValue("TOTAL_RUNNERS", { required: false }),
    thisRunner: getEnvValue("THIS_RUNNER", { required: false }),
    cypressSpecs: getEnvValue("CYPRESS_SPECS", { required: false }),
  };
}

export async function cypressSplit(on: any, config: any) {
  try {
    let currentRunner = 0;
    let allRunners = 1;
    let specPattern = await config.specPattern;
    const ignorePattern = await config.excludeSpecPattern;
    const { cypressSpecs, thisRunner, totalRunners } = getArgs();

    if (cypressSpecs != "")
      specPattern = cypressSpecs?.split(",").filter((val) => val !== "");

    if (totalRunners != "") {
      currentRunner = Number(thisRunner);
      allRunners = Number(totalRunners);
    }

    const specs = await getSpecsToRun(
      allRunners,
      currentRunner,
      specPattern,
      ignorePattern,
    );

    if (specs.length > 0) {
      config.specPattern = specs.length == 1 ? specs[0] : specs;
    } else {
      config.specPattern = "cypress/scripts/no_spec.ts";
    }
    return config;
  } catch (err) {
    console.log(err);
  }
}
