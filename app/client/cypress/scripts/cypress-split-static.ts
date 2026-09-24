import util from "./util";
import {
  DEFAULT_SPEC_DURATION_MS,
  divideSpecsIntoBalancedGroups,
} from "./specPacking";

export class staticSplit {
  util = new util();
  dbClient = this.util.configureDbClient();

  private async getSpecsWithTime(specs: string[], attemptId: number) {
    const client = await this.dbClient.connect();
    const specsMap = new Map();
    try {
      const queryRes = await client.query(
        'SELECT * FROM public."spec_avg_duration" ORDER BY duration DESC',
      );

      queryRes.rows.forEach((obj) => {
        specsMap.set(obj.name, obj);
      });

      const allSpecsWithDuration = specs.map((spec) => {
        const match = specsMap.get(spec);
        return match
          ? match
          : { name: spec, duration: DEFAULT_SPEC_DURATION_MS };
      });

      return divideSpecsIntoBalancedGroups(
        allSpecsWithDuration,
        Number(this.util.getVars().totalRunners),
      );
    } catch (err) {
      // Without weights this shard would fall back to no_spec.ts, and a shard
      // that runs nothing still prints the pass marker. Fail loudly instead.
      console.log("Could not read spec durations for this runner.", err);
      throw err;
    } finally {
      client.release();
    }
  }

  // This function will finally get the specs as a comma separated string to pass the specs to the command
  private async getSpecsToRun(
    specPattern: string | string[] = "cypress/e2e/**/**/*.{js,ts}",
    ignorePattern: string | string[],
    attemptId: number,
  ): Promise<string[]> {
    try {
      const specFilePaths = await this.util.getSpecFilePaths(
        specPattern,
        ignorePattern,
      );

      if (this.util.getVars().cypressRerun === "true") {
        return specFilePaths;
      } else {
        const specsToRun = await this.getSpecsWithTime(
          specFilePaths,
          attemptId,
        );
        return specsToRun === undefined || specsToRun.length === 0
          ? []
          : specsToRun[Number(this.util.getVars().thisRunner)].map(
              (spec) => spec.name,
            );
      }
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }

  private async createAttempt() {
    const client = await this.dbClient.connect();
    try {
      const workflowName = this.util.getVars().gitWorkflowName;
      const commitMsgWithWorkflow = `${this.util.getVars().commitMsg}_${workflowName}`;
      const runResponse = await client.query(
        `INSERT INTO public."attempt" ("workflowId", "attempt", "repo", "committer", "type", "commitMsg", "branch")
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT ("workflowId", attempt) DO NOTHING
          RETURNING id;`,
        [
          this.util.getVars().runId,
          this.util.getVars().attempt_number,
          this.util.getVars().repository,
          this.util.getVars().committer,
          this.util.getVars().tag,
          commitMsgWithWorkflow,
          this.util.getVars().branch,
        ],
      );

      if (runResponse.rows.length > 0) {
        return runResponse.rows[0].id;
      } else {
        const res = await client.query(
          `SELECT id FROM public."attempt" WHERE "workflowId" = $1 AND attempt = $2`,
          [this.util.getVars().runId, this.util.getVars().attempt_number],
        );
        return res.rows[0].id;
      }
    } catch (err) {
      console.log(err);
    } finally {
      client.release();
    }
  }

  private async getFailedSpecsFromPreviousRun(
    runnerId = Number(this.util.getVars().thisRunner),
    workflowId = Number(this.util.getVars().runId),
    attempt_number = Number(this.util.getVars().attempt_number) - 1,
  ) {
    const client = await this.dbClient.connect();
    try {
      const dbRes = await client.query(
        `SELECT name FROM public."specs" 
      WHERE "matrixId" = 
      (SELECT id FROM public."matrix" 
       WHERE "attemptId" = (
         SELECT id FROM public."attempt" WHERE "workflowId" = $1 and "attempt" = $2
       ) AND "matrixId" = $3
      ) AND status IN ('fail', 'queued', 'in-progress')`,
        [workflowId, attempt_number, runnerId],
      );
      const specs: string[] =
        dbRes.rows.length > 0 ? dbRes.rows.map((row) => row.name) : [];
      return specs;
    } catch (err) {
      // On a re-run this list is the whole spec set for the shard. Running
      // no_spec.ts instead would report a pass without retrying anything.
      console.log("Could not read the failed specs of the previous run.", err);
      throw err;
    } finally {
      client.release();
    }
  }

  // Records this runner's matrix row and its queued specs in one transaction,
  // so a failure part-way leaves nothing behind instead of a matrix row with
  // some of its specs missing. A cypress-repeat-pro retry re-runs the splitter
  // with the same matrixId/attemptId; the insert is then a no-op and the rows
  // queued by the first run stand. Bookkeeping stays best-effort: a failure
  // here is logged, not raised.
  private async registerSpecsForMatrix(attemptId: number, specs: string[]) {
    if (specs.length === 0) {
      return;
    }
    const client = await this.dbClient.connect();
    try {
      await client.query("BEGIN");
      const matrixResponse = await client.query(
        `INSERT INTO public."matrix" ("workflowId", "matrixId", "status", "attemptId")
          VALUES ($1, $2, $3, $4)
          ON CONFLICT ("matrixId", "attemptId") DO NOTHING
          RETURNING id;`,
        [
          this.util.getVars().runId,
          this.util.getVars().thisRunner,
          "started",
          attemptId,
        ],
      );

      if (matrixResponse.rows.length > 0) {
        await client.query(
          `INSERT INTO public."specs" ("name", "matrixId", "status")
            SELECT name, $2::integer, $3::varchar FROM unnest($1::text[]) AS name`,
          [specs, matrixResponse.rows[0].id, "queued"],
        );
      } else {
        console.log(
          "Matrix row already exists for this runner; keeping the specs queued by the first run.",
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      console.log(
        "Could not record the specs for this runner; its results will not be tracked.",
        err,
      );
    } finally {
      client.release();
    }
  }

  private async getFlakySpecs() {
    const client = await this.dbClient.connect();
    try {
      const dbRes = await client.query(
        `SELECT spec FROM public."flaky_specs" WHERE skip=true`,
      );
      const specs: string[] =
        dbRes.rows.length > 0 ? dbRes.rows.map((row) => row.spec) : [];
      return specs;
    } catch (err) {
      console.log(err);
    } finally {
      client.release();
    }
  }

  public async splitSpecs(config: Cypress.PluginConfigOptions) {
    try {
      let specPattern = config.specPattern;
      let ignorePattern: string | string[] = config.excludeSpecPattern;
      const cypressSpecs = this.util.getVars().cypressSpecs;
      const defaultSpec = "cypress/scripts/no_spec.ts";

      if (cypressSpecs != "") {
        specPattern = cypressSpecs?.split(",").filter((val) => val !== "");
      }

      if (this.util.getVars().cypressRerun === "true") {
        specPattern =
          (await this.getFailedSpecsFromPreviousRun()) ?? defaultSpec;
      }

      if (this.util.getVars().cypressSkipFlaky === "true") {
        let specsToSkip = (await this.getFlakySpecs()) ?? [];
        ignorePattern = [...ignorePattern, ...specsToSkip];
      }

      const attempt = await this.createAttempt();
      const specs =
        (await this.getSpecsToRun(specPattern, ignorePattern, attempt)) ?? [];
      console.log("SPECS TO RUN ----------> :", specs);
      console.log("attempt ID  ----------> :", attempt);
      if (specs.length > 0 && !specs.includes(defaultSpec)) {
        config.specPattern = specs.length == 1 ? specs[0] : specs;
      } else {
        config.specPattern = defaultSpec;
      }
      await this.registerSpecsForMatrix(attempt, specs);

      return config;
    } catch (err) {
      // Returning without a config would let Cypress start with no specs and
      // report a pass. Let the plugin load fail and the shard go red.
      console.log("Spec allocation failed for this runner.", err);
      throw err;
    } finally {
      this.dbClient.end();
    }
  }
}
