import os from "os";
import { util } from "./util";

export async function cypressHooks(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
) {
  const _ = new util();
  const s3 = _.configureS3();
  const dbClient = _.configureDbClient();
  const runData: any = {
    commitMsg: _.getVars().commitMsg,
    workflowId: _.getVars().runId,
    attempt: _.getVars().attempt_number,
    os: os.type(),
    repo: _.getVars().repository,
    committer: _.getVars().committer,
    type: _.getVars().tag,
    branch: _.getVars().branch,
  };
  const matrix: any = {
    matrixId: _.getVars().thisRunner,
    matrixStatus: "started",
  };
  const specData: any = {};

  on("before:run", async (runDetails: Cypress.BeforeRunDetails) => {
    runData.browser = runDetails.browser?.name;
    const client = await dbClient.connect();
    try {
      const runResponse = await client.query(
        `INSERT INTO public.attempt ("workflowId", "attempt", "browser", "os", "repo", "committer", "type", "commitMsg", "branch")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT ("workflowId", attempt) DO NOTHING
            RETURNING id;`,
        [
          runData.workflowId,
          runData.attempt,
          runData.browser,
          runData.os,
          runData.repo,
          runData.committer,
          runData.type,
          runData.commitMsg,
          runData.branch,
        ],
      );

      if (runResponse.rows.length > 0) {
        runData.attemptId = runResponse.rows[0].id; // Save the inserted attempt ID for later updates
      } else {
        const res = await client.query(
          `SELECT id FROM public.attempt WHERE "workflowId" = $1 AND attempt = $2`,
          [runData.workflowId, runData.attempt],
        );
        runData.attemptId = res.rows[0].id;
      }

      const matrixResponse = await client.query(
        `INSERT INTO public.matrix ("workflowId", "matrixId", "status", "attemptId")
            VALUES ($1, $2, $3, $4)
            ON CONFLICT ("matrixId", "attemptId") DO NOTHING
            RETURNING id;`,
        [
          runData.workflowId,
          matrix.matrixId,
          matrix.matrixStatus,
          runData.attemptId,
        ],
      );
      matrix.id = matrixResponse.rows[0].id; // Save the inserted matrix ID for later updates
    } catch (err) {
      console.log(err);
    } finally {
      client.release();
    }
  });

  on("before:spec", async (spec: Cypress.Spec) => {
    console.log("BEFORE SPEC SPEC DETAILS ------->", spec);
    specData.name = spec.relative;
    specData.matrixId = matrix.id;
    const client = await dbClient.connect();
    try {
      if (!specData.name.includes("no_spec.ts")) {
        const specResponse = await client.query(
          'INSERT INTO public.specs ("name", "matrixId") VALUES ($1, $2) RETURNING id',
          [specData.name, matrix.id],
        );
        specData.specId = specResponse.rows[0].id; // Save the inserted spec ID for later updates
      }
    } catch (err) {
      console.log(err);
    } finally {
      client.release();
    }
  });

  on(
    "after:spec",
    async (spec: Cypress.Spec, results: CypressCommandLine.RunResult) => {
      const client = await dbClient.connect();
      try {
        if (!specData.name.includes("no_spec.ts")) {
          await client.query(
            'UPDATE public.specs SET "testCount" = $1, "passes" = $2, "failed" = $3, "skipped" = $4, "pending" = $5, "status" = $6, "duration" = $7 WHERE id = $8',
            [
              results.stats.tests,
              results.stats.passes,
              results.stats.failures,
              results.stats.skipped,
              results.stats.pending,
              results.stats.failures > 0 ? "fail" : "pass",
              results.stats.duration,
              specData.specId,
            ],
          );
          for (const test of results.tests) {
            const testResponse = await client.query(
              `INSERT INTO public.tests ("name", "specId", "status", "retries", "retryData") VALUES ($1, $2, $3, $4, $5) RETURNING id`,
              [
                test.title[1],
                specData.specId,
                test.state,
                test.attempts.length,
                JSON.stringify(test.attempts),
              ],
            );
            if (
              test.attempts.some((attempt) => attempt.state === "failed") &&
              results.screenshots
            ) {
              const out = results.screenshots.filter((scr) =>
                scr.name.includes(test.title[1]),
              );
              console.log("Uploading screenshots...");
              for (const scr of out) {
                const key = `${testResponse.rows[0].id}_${specData.specId}_${
                  scr.name.includes("attempt 2") ? 2 : 1
                }`;
                Promise.all([_.uploadToS3(s3, scr.path, key)]).catch(
                  (error) => {
                    console.log("Error in uploading screenshots:", error);
                  },
                );
              }
            }
          }

          if (
            results.tests.some((test) =>
              test.attempts.some((attempt) => attempt.state === "failed"),
            ) &&
            results.video
          ) {
            console.log("Uploading video...");
            const key = `${specData.specId}`;
            Promise.all([_.uploadToS3(s3, results.video, key)]).catch(
              (error) => {
                console.log("Error in uploading video:", error);
              },
            );
          }
        }
      } catch (err) {
        console.log(err);
      } finally {
        await client.release();
      }
    },
  );

  on("after:run", async (runDetails) => {
    const client = await dbClient.connect();
    try {
      await client.query(
        `UPDATE public.matrix SET "status" = $1 WHERE id = $2`,
        ["done", matrix.id],
      );
      await client.query(
        `UPDATE public.attempt SET "endTime" = $1 WHERE "id" = $2`,
        [new Date(), runData.attemptId],
      );
    } catch (err) {
      console.log(err);
    } finally {
      await dbClient.end();
    }
  });
}
