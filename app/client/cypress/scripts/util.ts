import { Pool } from "pg";
import { S3 } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import { Octokit } from "@octokit/rest";
import fetch from "node-fetch";
import globby from "globby";
import minimatch from "minimatch";

export interface DataItem {
  name: string;
  duration: string;
}
export default class util {
  public getVars() {
    return {
      runId: this.getEnvValue("RUNID", { required: true }),
      attempt_number: this.getEnvValue("ATTEMPT_NUMBER", { required: true }),
      repository: this.getEnvValue("REPOSITORY", { required: true }),
      committer: this.getEnvValue("COMMITTER", { required: true }),
      tag: this.getEnvValue("TAG", { required: true }),
      branch: this.getEnvValue("BRANCH", { required: true }),
      cypressDbUser: this.getEnvValue("CYPRESS_DB_USER", { required: true }),
      cypressDbHost: this.getEnvValue("CYPRESS_DB_HOST", { required: true }),
      cypressDbName: this.getEnvValue("CYPRESS_DB_NAME", { required: true }),
      cypressDbPwd: this.getEnvValue("CYPRESS_DB_PWD", { required: true }),
      cypressS3Access: this.getEnvValue("CYPRESS_S3_ACCESS", {
        required: true,
      }),
      cypressS3Secret: this.getEnvValue("CYPRESS_S3_SECRET", {
        required: true,
      }),
      githubToken: process.env["GITHUB_TOKEN"],
      commitMsg: this.getEnvValue("COMMIT_INFO_MESSAGE", { required: false }),
      totalRunners: this.getEnvValue("TOTAL_RUNNERS", { required: false }),
      thisRunner: this.getEnvValue("THIS_RUNNER", { required: true }),
      cypressSpecs: this.getEnvValue("CYPRESS_SPECS", { required: false }),
      cypressRerun: this.getEnvValue("CYPRESS_RERUN", { required: false }),
      cypressSkipFlaky: this.getEnvValue("CYPRESS_SKIP_FLAKY", {
        required: false,
      }),
      staticAllocation: this.getEnvValue("CYPRESS_STATIC_ALLOCATION", {
        required: false,
      }),
      gitWorkflowName: this.getEnvValue("GITHUB_WORKFLOW", { required: false }),
    };
  }

  public async divideSpecsIntoBalancedGroups(
    data: DataItem[],
    numberOfGroups: number,
  ): Promise<DataItem[][]> {
    const groups: DataItem[][] = Array.from(
      { length: numberOfGroups },
      () => [],
    );
    data.forEach((item) => {
      // Find the group with the shortest total duration and add the item to it
      const shortestGroupIndex = groups.reduce(
        (minIndex, group, currentIndex) => {
          const totalDuration = groups[minIndex].reduce(
            (acc, item) => acc + Number(item.duration),
            0,
          );
          const totalDurationCurrent = group.reduce(
            (acc, item) => acc + Number(item.duration),
            0,
          );
          return totalDurationCurrent < totalDuration ? currentIndex : minIndex;
        },
        0,
      );
      groups[shortestGroupIndex].push(item);
    });
    return groups;
  }

  // This function will get all the spec paths using the pattern
  public async getSpecFilePaths(
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

  public getEnvValue(varName: string, { required = true }): string {
    if (required && process.env[varName] === undefined) {
      throw Error(
        `${varName} is not defined.
        Please check all the following environment variables are defined properly
        [ RUNID, ATTEMPT_NUMBER, REPOSITORY, COMMITTER, TAG, BRANCH, THIS_RUNNER, CYPRESS_DB_USER, CYPRESS_DB_HOST, CYPRESS_DB_NAME, CYPRESS_DB_PWD, CYPRESS_S3_ACCESS, CYPRESS_S3_SECRET ].`,
      );
    }
    return process.env[varName] ?? "";
  }

  //This is to setup the db client
  public configureDbClient() {
    const dbConfig = {
      user: this.getVars().cypressDbUser,
      host: this.getVars().cypressDbHost,
      database: this.getVars().cypressDbName,
      password: this.getVars().cypressDbPwd,
      port: 5432,
      connectionTimeoutMillis: 60000,
      ssl: true,
      keepalives: 30,
    };
    const dbClient = new Pool(dbConfig);
    return dbClient;
  }

  // This is to setup the AWS client
  public configureS3() {
    const s3client = new S3({
      region: "ap-south-1",
      credentials: {
        accessKeyId: this.getVars().cypressS3Access,
        secretAccessKey: this.getVars().cypressS3Secret,
      },
    });
    return s3client;
  }

  // This is to upload files to s3 when required
  public async uploadToS3(s3Client: S3, filePath: string, key: string) {
    const fileContent = fs.readFileSync(filePath);
    const params = {
      Bucket: "appsmith-internal-cy-db",
      Key: key,
      Body: fileContent,
    };
    return await new Upload({ client: s3Client, params }).done();
  }

  public async getActiveRunners() {
    const octokit = new Octokit({
      auth: this.getVars().githubToken,
      request: {
        fetch: fetch,
      },
    });
    try {
      const repo: string[] = this.getVars().repository.split("/");
      const response = await octokit.request(
        "GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs",
        {
          owner: repo[0],
          repo: repo[1],
          run_id: Number(this.getVars().runId),
          per_page: 100,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        },
      );
      const active_runners = response.data.jobs.filter(
        (job) =>
          (job.status === "in_progress" || job.status === "queued") &&
          job.run_attempt === Number(this.getVars().attempt_number),
      );
      return active_runners.length;
    } catch (error) {
      console.error("Error:", error);
    }
  }
}
