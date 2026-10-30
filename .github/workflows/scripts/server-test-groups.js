"use strict";

// Splits the server unit test classes into groups of similar run time, for the
// parallel jobs in server-build.yml.
//
//   node server-test-groups.js plan --root app/server \
//     --durations server-test-durations.tsv --groups 5 --group 2
//     Prints the comma-separated test classes of group 2, for `mvn test -Dtest=...`.
//     The durations file is optional.
//
//   node server-test-groups.js durations --reports app/server > durations.tsv
//     Reads the surefire TEST-*.xml reports under --reports and prints
//     "<seconds>\t<class>" lines, one per test class.
//
// Every server-build.yml job computes the same plan from the same inputs, so the
// groups never overlap and together hold every test class. A class with a recorded
// duration weighs its seconds. A class without one weighs its number of test
// methods, converted to seconds at the average rate of the recorded classes.

const fs = require("node:fs");
const path = require("node:path");

// Surefire's default includes, plus `*TestEE`, a name that some test classes use. The
// `test` parameter replaces the includes, so the plan selects every test class itself.
const TEST_FILE = /^(Test.*|.*Test|.*Tests|.*TestCase|.*TestEE)\.java$/;
const TEST_METHOD = /@(Test|ParameterizedTest|RepeatedTest)\b/g;
const SKIPPED_DIRS = new Set(["target", "node_modules", ".git"]);

function walk(dir, visit, skipped = SKIPPED_DIRS) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!skipped.has(entry.name)) walk(path.join(dir, entry.name), visit, skipped);
    } else if (entry.isFile()) {
      visit(path.join(dir, entry.name), entry.name);
    }
  }
}

// A surefire execution with a fixed `<test>` runs that class in its own JVM setup,
// and the default execution excludes it. A `-Dtest` list that named it would run it
// in the default execution too, without that setup.
function pinnedTests(pomText) {
  return [...pomText.matchAll(/<test>\s*([A-Za-z0-9_]+)\s*<\/test>/g)].map((m) => m[1]);
}

function countTestMethods(source) {
  return (source.match(TEST_METHOD) || []).length;
}

// Returns a map from simple class name to its number of test methods. Classes that
// share a simple name are one entry, because `-Dtest` selects them together.
function discoverTestClasses(root) {
  const classes = new Map();
  const pinned = new Set();
  walk(root, (file, name) => {
    if (name === "pom.xml") {
      pinnedTests(fs.readFileSync(file, "utf8")).forEach((t) => pinned.add(t));
    } else if (TEST_FILE.test(name) && file.split(path.sep).join("/").includes("/src/test/java/")) {
      const cls = name.slice(0, -".java".length);
      const methods = countTestMethods(fs.readFileSync(file, "utf8"));
      classes.set(cls, (classes.get(cls) || 0) + methods);
    }
  });
  for (const cls of pinned) classes.delete(cls);
  return classes;
}

function parseDurations(text) {
  const durations = new Map();
  for (const line of text.split("\n")) {
    const [seconds, name] = line.trim().split(/\s+/);
    if (name && seconds !== "" && !Number.isNaN(Number(seconds))) durations.set(name, Number(seconds));
  }
  return durations;
}

function readDurations(file) {
  if (!file || !fs.existsSync(file)) return new Map();
  return parseDurations(fs.readFileSync(file, "utf8"));
}

// A class with no test methods in its own source (a helper, or a class that only
// inherits its tests) still counts as one method.
function classWeights(classes, durations) {
  let knownSeconds = 0;
  let knownMethods = 0;
  for (const [cls, methods] of classes) {
    if (durations.has(cls)) {
      knownSeconds += durations.get(cls);
      knownMethods += Math.max(methods, 1);
    }
  }
  const secondsPerMethod = knownMethods > 0 && knownSeconds > 0 ? knownSeconds / knownMethods : 1;
  return [...classes].map(([name, methods]) => ({
    name,
    weight: durations.has(name) ? durations.get(name) : Math.max(methods, 1) * secondsPerMethod,
  }));
}

// Heaviest class first, each into the group with the least total so far.
function planGroups(classes, durations, groupCount) {
  const weighted = classWeights(classes, durations).sort(
    (a, b) => b.weight - a.weight || a.name.localeCompare(b.name),
  );
  const groups = Array.from({ length: groupCount }, () => ({ weight: 0, classes: [] }));
  for (const { name, weight } of weighted) {
    let target = groups[0];
    for (const group of groups) if (group.weight < target.weight) target = group;
    target.weight += weight;
    target.classes.push(name);
  }
  for (const group of groups) group.classes.sort();
  return groups;
}

// Surefire writes one TEST-<class>.xml per test class, with the class run time on the
// <testsuite> element. A nested class counts toward its outer class, which is the
// one -Dtest selects.
function durationsFromReports(root) {
  const totals = new Map();
  walk(
    root,
    (file, name) => {
      if (!/^TEST-.*\.xml$/.test(name) || !file.split(path.sep).includes("surefire-reports")) return;
      const head = fs.readFileSync(file, "utf8").slice(0, 4096);
      const suite = head.match(/<testsuite\b[^>]*>/);
      if (!suite) return;
      const fqcn = (suite[0].match(/\bname="([^"]+)"/) || [])[1];
      const time = (suite[0].match(/\btime="([^"]+)"/) || [])[1];
      if (!fqcn || time === undefined) return;
      const seconds = Number(time.replace(/,/g, ""));
      if (Number.isNaN(seconds)) return;
      const cls = fqcn.split(".").pop().split("$")[0];
      totals.set(cls, (totals.get(cls) || 0) + seconds);
    },
    new Set(["node_modules", ".git"]),
  );
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cls, seconds]) => `${seconds.toFixed(1)}\t${cls}`)
    .join("\n");
}

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith("--") || argv[i + 1] === undefined) {
      throw new Error(`Expected --name value pairs, got: ${argv.slice(i).join(" ")}`);
    }
    options[argv[i].slice(2)] = argv[i + 1];
  }
  return options;
}

function main(argv) {
  const [command, ...rest] = argv;
  const options = parseArgs(rest);

  if (command === "durations") {
    if (!options.reports) throw new Error("durations needs --reports");
    const text = durationsFromReports(options.reports);
    process.stdout.write(text ? text + "\n" : "");
    return;
  }
  if (command !== "plan") throw new Error("Usage: server-test-groups.js plan|durations [options]");

  const { root, durations, groups, group } = options;
  const groupCount = Number(groups);
  const groupNumber = Number(group);
  if (!root) throw new Error("plan needs --root");
  if (!Number.isInteger(groupCount) || groupCount < 1) throw new Error(`Invalid --groups: ${groups}`);
  if (!Number.isInteger(groupNumber) || groupNumber < 1 || groupNumber > groupCount) {
    throw new Error(`Invalid --group: ${group} (expected 1 to ${groupCount})`);
  }

  const classes = discoverTestClasses(root);
  const recorded = readDurations(durations);
  const known = [...classes.keys()].filter((c) => recorded.has(c)).length;
  console.error(`${classes.size} test classes, ${known} with a recorded duration`);
  const plan = planGroups(classes, recorded, groupCount);
  plan.forEach((g, i) =>
    console.error(`Group ${i + 1}: ${g.classes.length} classes, weight ${Math.round(g.weight)}`),
  );
  process.stdout.write(plan[groupNumber - 1].classes.join(",") + "\n");
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  classWeights,
  countTestMethods,
  discoverTestClasses,
  durationsFromReports,
  parseDurations,
  pinnedTests,
  planGroups,
  readDurations,
};
