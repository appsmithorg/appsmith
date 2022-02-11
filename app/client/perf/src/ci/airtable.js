var Airtable = require("airtable");
var base = new Airtable({ apiKey: "keyzq3xHSrEDiYpBf" }).base(
  "appbVpEa2wHAr7q41",
);

/**
 * Takes the results we get form parsed reports and converts them into rows
 * which can be stored in airtable
 */
const processResults = async (results) => {
  rows = [];
  Object.keys(results).forEach((action) => {
    Object.keys(results[action]).forEach((metric) => {
      let row = {};
      row["action"] = action;
      row["metric"] = metric;
      const runs = results[action][metric];
      runs.forEach((value, i) => {
        if (i < 5) {
          row[`run_${i + 1}`] = value;
        }
      });
      rows.push({ fields: row });
    });
  });

  return rows;
  try {
    await base("Runs").create(rows.slice(0, 10));
  } catch (e) {
    console.log(e);
  }
  // const processedRoes = rows.map(processRow);
};

const addToAirTable = async (rows) => {
  while (rows.length) {
    try {
      await base("Runs").create(rows.splice(0, 10));
    } catch (e) {
      console.log(e);
    }
  }
};
const storeResults = async (results) => {
  const rows = await processResults(results);
  await addToAirTable(rows);
};
storeResults(testResults);
