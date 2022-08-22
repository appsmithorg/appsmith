/*
`node ChromeTracer-test.js` to get stats from the profiler json.
*/

const eventsJson = require("./test_data.json");
const { getStats } = require("./ChromeTracer/index");
getStats(eventsJson);
