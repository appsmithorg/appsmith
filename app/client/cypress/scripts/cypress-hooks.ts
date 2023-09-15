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
    workflowId: _.getVars().runId,
    attempt: _.getVars().attempt_number,
    os: os.type(),
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
      const attemptRes = await client.query(
        `UPDATE public."attempt" SET "browser" = $1, "os" = $2  WHERE "workflowId" = $3 AND attempt = $4 RETURNING id`,
        [runData.browser, runData.os, runData.workflowId, runData.attempt],
      );
      runData.attemptId = attemptRes.rows[0].id;
      console.log("BEFORE RUN ATTEMPT ID ====>", runData.attemptId);
      const matrixRes = await client.query(
        `SELECT id FROM public."matrix" WHERE "attemptId" = $1 AND "matrixId" = $2`,
        [runData.attemptId, matrix.matrixId],
      );
      matrix.id = matrixRes.rowCount > 0 ? matrixRes.rows[0].id : "";
      console.log("BEFORE RUN MATRIX ID ====>", matrix.id);
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
          `SELECT id FROM public."specs" WHERE "name" = $1 AND "matrixId" = $2`,
          [specData.name, matrix.id],
        );
        specData.specId = specResponse.rows[0].id;
        console.log("BEFORE SPEC SPEC ID ------->", specData.specId); // Save the inserted spec ID for later updates
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
                test.displayError,
              ],
            );
            console.log("TEST NAME: ", test.title[1]);
            console.log(
              "-----------------------------------------------------",
            );
            console.log("TEST =======> ", JSON.parse(JSON.stringify(test)));
            console.log(
              "TEST ID=======> ",
              JSON.parse(JSON.stringify(testResponse)),
            );
            if (
              test.attempts.some((attempt) => attempt.state === "failed") &&
              results.screenshots.length > 0
            ) {
              const out = results.screenshots.filter((scr) =>
                scr.path.includes(test.title[1]),
              );
              console.log("TEST SCREENSHOTS ====> ", JSON.stringify(out));
              console.log("Uploading screenshots...");
              for (const scr of out) {
                console.log(
                  "TEST SCREENSHOTS INDIVIDUAL ====> ",
                  JSON.stringify(scr),
                );
                const attempt = scr.path.includes("attempt 2") ? 2 : 1;
                console.log(
                  "TEST SCREENSHOTS INDIVIDUAL ATTEMPT====> ",
                  attempt,
                );
                const key = `${testResponse.rows[0].id}_${specData.specId}_${attempt}`;
                await _.uploadToS3(s3, scr.path, key)
                  .then((res) => {
                    console.log(res);
                  })
                  .catch((error) => {
                    console.log("Error in uploading screenshots:", error);
                  });
              }
              console.log(
                "-----------------------------------------------------",
              );
            }
          }

          console.log("VIDEO =======> ", results.video);
          if (
            results.tests.some((test) =>
              test.attempts.some((attempt) => attempt.state === "failed"),
            ) &&
            results.video
          ) {
            console.log("Uploading video...");
            const key = `${specData.specId}`;
            console.log("VIDEO KEY ----> ", key);
            _.uploadToS3(s3, results.video, key)
              .then((res) => {
                console.log(res);
              })
              .catch((error) => {
                console.log("Error in uploading video:", error);
              });
          }
        }
      } catch (err) {
        console.log(err);
      } finally {
        client.release();
      }
    },
  );

  on("after:run", async (runDetails) => {
    const client = await dbClient.connect();
    try {
      if (!specData.name.includes("no_spec.ts")) {
        await client.query(
          `UPDATE public.matrix SET "status" = $1 WHERE id = $2`,
          ["done", matrix.id],
        );
        await client.query(
          `UPDATE public.attempt SET "endTime" = $1 WHERE "id" = $2`,
          [new Date(), runData.attemptId],
        );
      }
    } catch (err) {
      console.log(err);
    } finally {
      client.release();
      await dbClient.end();
    }
  });
}
