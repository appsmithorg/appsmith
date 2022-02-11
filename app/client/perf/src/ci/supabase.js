const { createClient } = require("@supabase/supabase-js");
const { actions } = require("../../tests/actions");
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
// const supabaseKey = process.env.SUPABASE_KEY;
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaWtldHVqc2Zmc21kbWdwbXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDQ1NjA2OTMsImV4cCI6MTk2MDEzNjY5M30.btcGnrHxv1hJP4V9IIV2tzFsO3hV4bdm2yZD1JD_Iow";
const supabase = createClient(supabaseUrl, supabaseKey);

const actionRows = Object.keys(actions).map((action) => ({
  name: actions[action],
}));

const createActions = async () => {
  const { data, error } = await supabase
    .from("action")
    .upsert(actionRows, { ignoreDuplicates: true });

  if (error) {
    console.log(error);
  }
};

const createMetrics = async () => {
  const { data, error } = await supabase.from("metric").upsert(
    metricsToLog.map((metric) => ({ name: metric })),
    { ignoreDuplicates: true, on_conflict: "name" },
  );
  if (error) {
    console.log(error);
  }
};

const createRunMeta = async () => {
  const { data, error } = await supabase.from("run_meta").insert([
    {
      gh_run_number: process.env?.GITHUB_RUN_NUMBER || 1,
      commit_id: process.env?.GITHUB_SHA,
      branch: process.env?.GITHUB_REF_NAME,
      gh_run_id: process.env?.GITHUB_RUN_ID || 1,
    },
  ]);
  if (data) {
    return data[0];
  }
  console.log(error);
};
const saveData = async (results) => {
  const run_meta = await createRunMeta();

  console.log(JSON.stringify(run_meta, "", 4));

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
      });
      rows.push(row);
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
createMetrics();
