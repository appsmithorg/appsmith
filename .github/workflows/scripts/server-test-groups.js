"use strict";

// Splits the server unit test classes into groups of similar run time, for the
// parallel jobs in server-build.yml.
//
//   node server-test-groups.js plan --root app/server \
//     --durations .github/workflows/server-test-durations --groups 5 --group 2
//     Prints the comma-separated test classes of group 2, for `mvn test -Dtest=...`.
//
//   node server-test-groups.js durations < mvn_test.log > ce.tsv
//     Reads surefire output and prints "<seconds>\t<class>" lines, one per test class.
//
// Every server-build.yml job computes the same plan from the same inputs, so the
// groups never overlap and together hold every test class. A class with no
// recorded duration gets the median of the recorded ones.

const fs = require("node:fs");
const path = require("node:path");

// Surefire's default includes, plus the `*TestEE` classes of the EE repository. The
// `test` parameter replaces the includes, so the plan selects every test class itself.
const TEST_FILE = /^(Test.*|.*Test|.*Tests|.*TestCase|.*TestEE)\.java$/;
const SKIPPED_DIRS = new Set(["target", "node_modules", ".git"]);
const DEFAULT_SECONDS = 5;

function walk(dir, visit) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name)) walk(path.join(dir, entry.name), visit);
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

function discoverTestClasses(root) {
  const classes = new Set();
  const pinned = new Set();
  walk(root, (file, name) => {
    if (name === "pom.xml") {
      pinnedTests(fs.readFileSync(file, "utf8")).forEach((t) => pinned.add(t));
    } else if (TEST_FILE.test(name) && file.split(path.sep).join("/").includes("/src/test/java/")) {
      classes.add(name.slice(0, -".java".length));
    }
  });
  return [...classes].filter((c) => !pinned.has(c)).sort();
}

function parseDurations(text) {
  const durations = new Map();
  for (const line of text.split("\n")) {
    const [seconds, name] = line.trim().split(/\s+/);
    if (name && !Number.isNaN(Number(seconds))) durations.set(name, Number(seconds));
  }
  return durations;
}

// Files are read in name order and a later file overrides an earlier one, so a
// repository-specific file can refine the shared measurements.
function readDurations(dir) {
  const durations = new Map();
  if (!fs.existsSync(dir)) return durations;
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith(".tsv")).sort()) {
    for (const [cls, seconds] of parseDurations(fs.readFileSync(path.join(dir, name), "utf8"))) {
      durations.set(cls, seconds);
    }
  }
  return durations;
}

function median(values) {
  if (values.length === 0) return DEFAULT_SECONDS;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Longest class first, each into the group with the least total so far.
function planGroups(classes, durations, groupCount) {
  const known = classes.filter((c) => durations.has(c)).map((c) => durations.get(c));
  const fallback = median(known);
  const weighted = classes
    .map((name) => ({ name, seconds: durations.has(name) ? durations.get(name) : fallback }))
    .sort((a, b) => b.seconds - a.seconds || a.name.localeCompare(b.name));

  const groups = Array.from({ length: groupCount }, () => ({ seconds: 0, classes: [] }));
  for (const { name, seconds } of weighted) {
    let target = groups[0];
    for (const group of groups) if (group.seconds < target.seconds) target = group;
    target.seconds += seconds;
    target.classes.push(name);
  }
  for (const group of groups) group.classes.sort();
  return groups;
}

// Surefire prints "Tests run: ..., Time elapsed: 1.23 s -- in com.example.FooTest".
// A nested class counts toward its outer class, which is the one -Dtest selects.
function durationsFromSurefireLog(text) {
  const totals = new Map();
  const line = /Tests run: .*Time elapsed: ([0-9.,]+) s.* in ([\w.$]+)/g;
  for (const [, seconds, fqcn] of text.matchAll(line)) {
    const name = fqcn.split(".").pop().split("$")[0];
    totals.set(name, (totals.get(name) || 0) + Number(seconds.replace(/,/g, "")));
  }
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, seconds]) => `${seconds.toFixed(1)}\t${name}`)
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
  if (command === "durations") {
    process.stdout.write(durationsFromSurefireLog(fs.readFileSync(0, "utf8")) + "\n");
    return;
  }
  if (command !== "plan") throw new Error("Usage: server-test-groups.js plan|durations [options]");

  const { root, durations, groups, group } = parseArgs(rest);
  const groupCount = Number(groups);
  const groupNumber = Number(group);
  if (!root || !durations) throw new Error("plan needs --root and --durations");
  if (!Number.isInteger(groupCount) || groupCount < 1) throw new Error(`Invalid --groups: ${groups}`);
  if (!Number.isInteger(groupNumber) || groupNumber < 1 || groupNumber > groupCount) {
    throw new Error(`Invalid --group: ${group} (expected 1 to ${groupCount})`);
  }

  const plan = planGroups(discoverTestClasses(root), readDurations(durations), groupCount);
  plan.forEach((g, i) =>
    console.error(`Group ${i + 1}: ${g.classes.length} classes, about ${Math.round(g.seconds)} s`),
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
  discoverTestClasses,
  durationsFromSurefireLog,
  parseDurations,
  pinnedTests,
  planGroups,
  readDurations,
};
