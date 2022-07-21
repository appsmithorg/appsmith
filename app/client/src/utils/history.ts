// Leaving this require here. Importing causes type mismatches which have not been resolved by including the typings or any other means. Ref: https://github.com/remix-run/history/issues/802
const createHistory = require("history").createBrowserHistory;
export default createHistory();
