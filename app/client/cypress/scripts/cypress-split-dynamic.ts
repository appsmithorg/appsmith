import util from "./util";

export class dynamicSplit {
  util = new util();
  dbClient = this.util.configureDbClient();

  private async getSpecsWithTime(specs: string[], attemptId: number) {
    const client = await this.dbClient.connect();
    const defaultDuration = 180000;
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
        return match ? match : { name: spec, duration: defaultDuration };
      });
      const activeRunners = await this.util.getActiveRunners();
      const activeRunnersFromDb = await this.getActiveRunnersFromDb(attemptId);
      return await this.util.divideSpecsIntoBalancedGroups(
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

      const specsToRun = await this.getSpecsWithTime(specFilePaths, attemptId);
      console.log("SPECS TO RUN ----------> :", specsToRun);
      return specsToRun === undefined || specsToRun.length === 0
        ? []
        : specsToRun[0].map((spec) => spec.name);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }

  private async getActiveRunnersFromDb(attemptId: number) {
    const client = await this.dbClient.connect();
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

  private async getAlreadyRunningSpecs() {
    const client = await this.dbClient.connect();
    try {
      const dbRes = await client.query(
        `SELECT name FROM public."specs" 
      WHERE "matrixId" IN 
      (SELECT id FROM public."matrix" 
       WHERE "attemptId" = (
         SELECT id FROM public."attempt" WHERE "workflowId" = $1 and "attempt" = $2
       )
      )`,
        [this.util.getVars().runId, this.util.getVars().attempt_number],
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

  private async createMatrix(attemptId: number) {
    const client = await this.dbClient.connect();
    try {
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
      return matrixResponse.rows[0].id;
    } catch (err) {
      console.log(err);
    } finally {
      client.release();
    }
  }

  private async getFailedSpecsFromPreviousRun(
    workflowId = Number(this.util.getVars().runId),
    attempt_number = Number(this.util.getVars().attempt_number) - 1,
  ) {
    const client = await this.dbClient.connect();
    try {
      const dbRes = await client.query(
        `SELECT name FROM public."specs" 
      WHERE "matrixId" IN 
      (SELECT id FROM public."matrix" 
       WHERE "attemptId" = (
         SELECT id FROM public."attempt" WHERE "workflowId" = $1 and "attempt" = $2
       )
      ) AND status IN ('fail', 'queued', 'in-progress')`,
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

  private async addSpecsToMatrix(matrixId: number, specs: string[]) {
    const client = await this.dbClient.connect();
    try {
      for (const spec of specs) {
        const res = await client.query(
          `INSERT INTO public."specs" ("name", "matrixId", "status") VALUES ($1, $2, $3) RETURNING id`,
          [spec, matrixId, "queued"],
        );
      }
    } catch (err) {
      console.log(err);
    } finally {
      client.release();
    }
  }

  private async addLockGetTheSpecs(
    attemptId: number,
    specPattern: string | string[],
    ignorePattern: string | string[],
  ) {
    const client = await this.dbClient.connect();
    let specs: string[] = [];
    let locked = false;
    let counter = 1;
    try {
      while (counter <= 120 && !locked) {
        const result = await client.query(
          `UPDATE public."attempt" SET is_locked = true WHERE id = $1 AND is_locked = false RETURNING id`,
          [attemptId],
        );
        if (result.rows.length === 1) {
          locked = true;
          let runningSpecs: string[] =
            (await this.getAlreadyRunningSpecs()) ?? [];
          if (typeof ignorePattern === "string") {
            runningSpecs.push(ignorePattern);
            ignorePattern = runningSpecs;
          } else {
            ignorePattern = runningSpecs.concat(ignorePattern);
          }
          specs = await this.getSpecsToRun(
            specPattern,
            ignorePattern,
            attemptId,
          );
          return specs;
        } else {
          await this.sleep(5000);
          counter++;
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      client.release();
    }
  }

  private async updateTheSpecsAndReleaseLock(
    attemptId: number,
    specs: string[],
  ) {
    const client = await this.dbClient.connect();
    try {
      if (specs.length > 0) {
        const matrixRes = await this.createMatrix(attemptId);
        await this.addSpecsToMatrix(matrixRes, specs);
      }
      await client.query(
        `UPDATE public."attempt" SET is_locked = false WHERE id = $1 AND is_locked = true RETURNING id`,
        [attemptId],
      );
    } catch (err) {
      console.log(err);
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

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async splitSpecs(config: Cypress.PluginConfigOptions) {
    try {
      let specPattern = config.specPattern;
      let ignorePattern: string | string[] = config.excludeSpecPattern;
      const cypressSpecs = this.util.getVars().cypressSpecs;
      const defaultSpec = "cypress/scripts/no_spec.ts";

      if (cypressSpecs != "")
        specPattern = cypressSpecs?.split(",").filter((val) => val !== "");
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
        (await this.addLockGetTheSpecs(attempt, specPattern, ignorePattern)) ??
        [];
      if (specs.length > 0 && !specs.includes(defaultSpec)) {
        config.specPattern = specs.length == 1 ? specs[0] : specs;
      } else {
        config.specPattern = defaultSpec;
      }
      await this.updateTheSpecsAndReleaseLock(attempt, specs);

      return config;
    } catch (err) {
      console.log(err);
    } finally {
      this.dbClient.end();
    }
  }
}
