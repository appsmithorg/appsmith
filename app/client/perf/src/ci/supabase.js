const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const { actions } = require("../../tests/actions");
const { parseReports } = require("../summary");
const supabaseUrl = "https://ymiketujsffsmdmgpmut.supabase.co";

const metricsToLog = [
  "scripting",
  "painting",
  "rendering",
  "idle",
  "other",
  "ForcedLayout",
  "ForcedStyle",
  "LongHandler",
  "LongTask",
];

const supabaseKey = process.env.APPSMITH_PERF_SUPABASE_SECRET;
const supabase = createClient(supabaseUrl, supabaseKey);

const actionRows = Object.keys(actions).map((action) => ({
  name: actions[action],
}));

const createActions = async () => {
  const errors = [];

  await Promise.all(
    actionRows.map(async (action) => {
      const { data, error } = await supabase
        .from("action")
        .upsert([action], { ignoreDuplicates: true });
      if (error) {
        errors.push(error);
      }
    }),
  );

  console.log(errors);
};

const createMetrics = async () => {
  const errors = [];

  await Promise.all(
    metricsToLog.map(async (metric) => {
      const { data, error } = await supabase
        .from("metric")
        .upsert([{ name: metric }], { ignoreDuplicates: true });
      if (error) {
        errors.push(error);
      }
    }),
  );

  console.log(errors);
};

const createRunMeta = async () => {
  let prId;
  try {
    const ev = JSON.parse(
      fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"),
    );

    prId = ev.client_payload.pull_request.number;
  } catch (e) {
    console.log("Error fetching PR id", e);
  }
  const { data, error } = await supabase.from("run_meta").insert([
    {
      gh_run_number: process.env?.GITHUB_RUN_NUMBER || 1,
      commit_id: process.env?.GITHUB_SHA,
      branch: process.env?.GITHUB_REF_NAME,
      gh_run_id: process.env?.GITHUB_RUN_ID || 1,
      pull_request_id: prId || parsePullRequestId(process.env.GITHUB_REF),
    },
  ]);
  if (data) {
    return data[0];
  }
  console.log(error);
};
const saveData = async (results) => {
  const run_meta = await createRunMeta();

  const rows = [];
  Object.keys(results).forEach((action) => {
    Object.keys(results[action]).forEach((metric) => {
      let row = {};
      row["action"] = action;
      row["metric"] = metric;
      row["meta"] = run_meta.id;
      const runs = results[action][metric];
      runs.forEach((value, i) => {
        row["value"] = value;
        rows.push(row);
      });
    });
  });

  const { data, error } = await supabase.from("run").insert(rows);

  if (error) {
    console.log(error);
  }
};

exports.saveToSupabase = async () => {
  const results = await parseReports(
    `${APP_ROOT}/traces/reports`,
    ["scripting", "painting", "rendering", "idle", "other"],
    ["ForcedLayout", "ForcedStyle", "LongHandler", "LongTask"],
  );

  await createMetrics();
  await createActions();
  await saveData(results);
};

"use strict";

const parsePullRequestId = (githubRef) => {
  const result = /refs\/pull\/(\d+)\/merge/g.exec(githubRef);
  if (!result) {
    return -1;
  }
  const [, pullRequestId] = result;
  return pullRequestId;
};

createMetrics();
