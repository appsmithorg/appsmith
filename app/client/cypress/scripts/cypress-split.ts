/* eslint-disable no-console */
import type { DataItem } from "./util";
import { util } from "./util";
import globby from "globby";
import minimatch from "minimatch";

const fs = require("fs/promises");
const _ = new util();
const dbClient = _.configureDbClient();

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

async function getSpecsWithTime(specs: string[]) {
  const client = await dbClient.connect();
  try {
    const queryRes = await client.query(
      `SELECT * FROM "spec_avg_duration ORDER BY "duration" DESC`,
    );
    const defaultDuration = 180000;
    const allSpecsWithDuration: DataItem[] = specs.map((spec) => {
      const match = queryRes.rows.find((obj) => obj.name === spec);
      return match ? match : { name: spec, duration: defaultDuration };
    });
    return await _.divideSpecsIntoBalancedGroups(
      allSpecsWithDuration,
      Number(_.getActiveRunners()),
    );
  } catch (err) {
    console.log(err);
  } finally {
    client.release();
  }
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
  specPattern: string | string[] = "cypress/e2e/**/**/*.{js,ts}",
  ignorePattern: string | string[],
): Promise<string[]> {
  try {
    const specFilePaths = await getSpecFilePaths(specPattern, ignorePattern);

    if (!specFilePaths.length) {
      throw Error("No spec files found.");
    }
    const specsToRun = await getSpecsWithTime(specFilePaths);
    return specsToRun === undefined
      ? []
      : specsToRun[0].map((spec) => spec.name);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

async function getAlreadyRunningSpecs() {
  const client = await dbClient.connect();
  try {
    const dbRes = await client.query(
      `SELECT name FROM public."specs" 
      WHERE "matrixId" IN 
      (SELECT id FROM public."matrix" 
       WHERE "attemptId" = (
         SELECT id FROM public."attempt" WHERE "workflowId" = $1 and "attempt" = $2
       )
      )`,
      [_.getVars().runId, _.getVars().attempt_number],
    );
    const specs: string[] =
      dbRes.rows.length > 0 ? dbRes.rows.map((row) => row.name) : [];
    return specs;
  } catch (err) {
    console.log(err);
  } finally {
    client.release();
  }
}

export async function cypressSplit(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
) {
  try {
    let currentRunner = 0;
    let allRunners = 1;
    let specPattern = config.specPattern;
    let ignorePattern: string | string[] = config.excludeSpecPattern;
    const { cypressSpecs, thisRunner, totalRunners } = _.getVars();

    if (cypressSpecs != "")
      specPattern = cypressSpecs?.split(",").filter((val) => val !== "");

    if (totalRunners != "") {
      currentRunner = Number(thisRunner);
      allRunners = Number(totalRunners);
    }

    let runningSpecs: string[] = (await getAlreadyRunningSpecs()) ?? [];
    if (typeof ignorePattern === "string") {
      runningSpecs.push(ignorePattern);
      ignorePattern = runningSpecs;
    } else {
      ignorePattern = runningSpecs.concat(ignorePattern);
    }

    const specs = await getSpecsToRun(specPattern, ignorePattern);
    if (specs.length > 0) {
      config.specPattern = specs.length == 1 ? specs[0] : specs;
    } else {
      config.specPattern = "cypress/scripts/no_spec.ts";
    }

    return config;
  } catch (err) {
    console.log(err);
  } finally {
    dbClient.end();
  }
}
