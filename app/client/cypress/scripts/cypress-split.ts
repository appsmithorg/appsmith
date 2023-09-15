/* eslint-disable no-console */
import type { DataItem } from "./util";
import { util } from "./util";
import globby from "globby";
import minimatch from "minimatch";
import type { PoolClient } from "pg";

const _ = new util();
const dbClient = _.configureDbClient();

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

async function getSpecsWithTime(specs: string[], attemptId: number) {
  const client = await dbClient.connect();
  try {
    const queryRes = await client.query(
      'SELECT * FROM public."spec_avg_duration" ORDER BY "duration" DESC',
    );
    const defaultDuration = 180000;
    const allSpecsWithDuration: DataItem[] = specs.map((spec) => {
      const match = queryRes.rows.find((obj) => obj.name === spec);
      return match ? match : { name: spec, duration: defaultDuration };
    });
    console.log("ALL SPECS WITH DURATION", allSpecsWithDuration);
    const activeRunners = await _.getActiveRunners();
    const activeRunnersFromDb = await getActiveRunnersFromDb(attemptId);
    return await _.divideSpecsIntoBalancedGroups(
      allSpecsWithDuration,
      Number(activeRunners) - Number(activeRunnersFromDb),
    );
  } catch (err) {
    console.log(err);
  } finally {
    client.release();
  }
}

// This function will finally get the specs as a comma separated string to pass the specs to the command
async function getSpecsToRun(
  specPattern: string | string[] = "cypress/e2e/**/**/*.{js,ts}",
  ignorePattern: string | string[],
  attemptId: number,
): Promise<string[]> {
  try {
    const specFilePaths = await getSpecFilePaths(specPattern, ignorePattern);
    console.log("ALL SPEC FILES PATH ===> ", specFilePaths);

    if (!specFilePaths.length) {
      throw Error("No spec files found.");
    }
    const specsToRun = await getSpecsWithTime(specFilePaths, attemptId);
    console.log("SPECS TO RUN ====>", specsToRun);
    return specsToRun === undefined
      ? []
      : specsToRun[0].map((spec) => spec.name);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

async function getActiveRunnersFromDb(attemptId: number) {
  const client = await dbClient.connect();
  try {
    const matrixRes = await client.query(
      `SELECT * FROM public."matrix" WHERE "attemptId" = $1`,
      [attemptId],
    );
    return matrixRes.rowCount;
  } catch (err) {
    console.log(err);
  } finally {
    client.release();
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

async function createAttempt() {
  const client = await dbClient.connect();
  try {
    const runResponse = await client.query(
      `INSERT INTO public."attempt" ("workflowId", "attempt", "repo", "committer", "type", "commitMsg", "branch")
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT ("workflowId", attempt) DO NOTHING
          RETURNING id;`,
      [
        _.getVars().runId,
        _.getVars().attempt_number,
        _.getVars().repository,
        _.getVars().committer,
        _.getVars().tag,
        _.getVars().commitMsg,
        _.getVars().branch,
      ],
    );

    if (runResponse.rows.length > 0) {
      return runResponse.rows[0].id;
    } else {
      const res = await client.query(
        `SELECT id FROM public."attempt" WHERE "workflowId" = $1 AND attempt = $2`,
        [_.getVars().runId, _.getVars().attempt_number],
      );
      return res.rows[0].id;
    }
  } catch (err) {
    console.log(err);
  } finally {
    client.release();
  }
}

async function createMatrix(attemptId: number) {
  const client = await dbClient.connect();
  try {
    const matrixResponse = await client.query(
      `INSERT INTO public."matrix" ("workflowId", "matrixId", "status", "attemptId")
          VALUES ($1, $2, $3, $4)
          ON CONFLICT ("matrixId", "attemptId") DO NOTHING
          RETURNING id;`,
      [_.getVars().runId, _.getVars().thisRunner, "started", attemptId],
    );
    return matrixResponse.rows[0].id;
  } catch (err) {
    console.log(err);
  } finally {
    client.release();
  }
}

async function getFailedSpecsFromPreviousRun(
  workflowId = Number(_.getVars().runId),
  attempt_number = Number(_.getVars().attempt_number) - 1,
) {
  const client = await dbClient.connect();
  try {
    const dbRes = await client.query(
      `SELECT name FROM public."specs" 
      WHERE "matrixId" IN 
      (SELECT id FROM public."matrix" 
       WHERE "attemptId" = (
         SELECT id FROM public."attempt" WHERE "workflowId" = $1 and "attempt" = $2
       )
      ) AND status = 'fail'`,
      [workflowId, attempt_number],
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

async function addSpecsToMatrix(
  client: PoolClient,
  matrixId: number,
  specs: string[],
) {
  try {
    for (const spec of specs) {
      const res = await client.query(
        `INSERT INTO public."specs" ("name", "matrixId") VALUES ($1, $2) RETURNING id`,
        [spec, matrixId],
      );
    }
  } catch (err) {
    console.log(err);
  }
}

async function addLockAndUpdateSpecs(
  attemptId: number,
  matrixId: number,
  specs: string[],
) {
  const client = await dbClient.connect();
  let locked = false;
  try {
    while (locked) {
      try {
        const result = await client.query(
          `SELECT * FROM public."attempt" WHERE id = $1 FOR UPDATE`,
          [attemptId],
        );
        if (result.rows.length === 1) {
          locked = true;
          console.log("LOCKED ======> ", locked);
          await addSpecsToMatrix(client, matrixId, specs);
        } else {
          await sleep(1000);
        }
      } catch (err) {
        console.log(err);
      }
    }
  } catch (err) {
    console.log(err);
  } finally {
    client.release();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function cypressSplit(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
) {
  try {
    let specPattern = config.specPattern;
    let ignorePattern: string | string[] = config.excludeSpecPattern;
    const cypressSpecs = _.getVars().cypressSpecs;
    const defaultSpec = "cypress/scripts/no_spec.ts";

    if (cypressSpecs != "")
      specPattern = cypressSpecs?.split(",").filter((val) => val !== "");
    if (_.getVars().cypressRerun === "true") {
      specPattern = (await getFailedSpecsFromPreviousRun()) ?? defaultSpec;
      console.log("RERUN SPEC PATTERN", specPattern);
    }

    let runningSpecs: string[] = (await getAlreadyRunningSpecs()) ?? [];
    if (typeof ignorePattern === "string") {
      runningSpecs.push(ignorePattern);
      ignorePattern = runningSpecs;
    } else {
      ignorePattern = runningSpecs.concat(ignorePattern);
    }

    const attempt = await createAttempt();
    const matrix = await createMatrix(Number(attempt));
    const specs = await getSpecsToRun(
      specPattern,
      ignorePattern,
      Number(attempt),
    );
    console.log("GET SPECS TO RUN IN SPLIT SPECS", specs);
    if (specs.length > 0 && !specs.includes(defaultSpec)) {
      config.specPattern = specs.length == 1 ? specs[0] : specs;
      await addLockAndUpdateSpecs(Number(attempt), Number(matrix), specs);
    } else {
      config.specPattern = defaultSpec;
    }

    return config;
  } catch (err) {
    console.log(err);
  } finally {
    dbClient.end();
  }
}
