"use strict";

// Run with: find .github/workflows/scripts -name '*.test.js' -exec node --test {} +
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const groups = require("./server-test-groups.js");

function tree(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "server-test-groups-"));
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  }
  return root;
}

function testClass(methods) {
  return `class X {\n${"  @Test\n  void t() {}\n".repeat(methods)}}\n`;
}

const totals = (plan) => plan.map((g) => g.weight);

test.describe("discoverTestClasses", () => {
  test("selects surefire's default test file names and *TestEE under src/test/java", () => {
    const root = tree({
      "server/src/test/java/com/a/FooTest.java": "",
      "server/src/test/java/com/a/FooTests.java": "",
      "server/src/test/java/com/a/FooTestCase.java": "",
      "server/src/test/java/com/a/TestFoo.java": "",
      "server/src/test/java/com/a/ActionServiceCE_Test.java": "",
      "server/src/test/java/com/a/ee/UserRepositoryTestEE.java": "",
      "server/src/test/java/com/a/FooHelper.java": "",
      "server/src/test/java/com/a/FooTestHelper.java": "",
      "server/src/test/java/com/a/FooTest.java.disabled": "",
      "server/src/test/java/com/a/FooIT.java": "",
      "server/src/main/java/com/a/MainTest.java": "",
      "server/target/test-classes/com/a/StaleTest.java": "",
    });
    assert.deepEqual([...groups.discoverTestClasses(root).keys()].sort(), [
      "ActionServiceCE_Test",
      "FooTest",
      "FooTestCase",
      "FooTests",
      "TestFoo",
      "UserRepositoryTestEE",
    ]);
  });

  test("leaves out classes pinned to their own surefire execution", () => {
    const root = tree({
      "plugin/pom.xml": "<configuration><test>ProxyEnvironmentTest</test></configuration>",
      "plugin/src/test/java/com/a/ProxyEnvironmentTest.java": "",
      "plugin/src/test/java/com/a/PluginTest.java": "",
    });
    assert.deepEqual([...groups.discoverTestClasses(root).keys()], ["PluginTest"]);
  });

  test("counts test methods, summed over classes that share a simple name", () => {
    const root = tree({
      "server/src/test/java/com/a/PluginServiceTest.java": testClass(2),
      "server/src/test/java/com/a/ee/PluginServiceTest.java":
        "@ParameterizedTest\n@RepeatedTest(3)\n@TestConfiguration\n@Tested\n",
    });
    assert.deepEqual([...groups.discoverTestClasses(root)], [["PluginServiceTest", 4]]);
  });
});

test.describe("planGroups", () => {
  const classes = new Map([
    ["A", 1],
    ["B", 1],
    ["C", 1],
    ["D", 1],
    ["E", 1],
    ["F", 1],
  ]);
  const durations = new Map([
    ["A", 60],
    ["B", 50],
    ["C", 40],
    ["D", 30],
    ["E", 20],
    ["F", 10],
  ]);

  test("every class lands in exactly one group", () => {
    const all = new Map([...classes, ["New1", 3], ["New2", 0]]);
    const plan = groups.planGroups(all, durations, 3);
    assert.deepEqual(plan.flatMap((g) => g.classes).sort(), [...all.keys()].sort());
  });

  test("balances by recorded duration, heaviest first", () => {
    const plan = groups.planGroups(classes, durations, 2);
    assert.deepEqual(totals(plan), [110, 100]);
    assert.deepEqual(plan[0].classes, ["A", "D", "E"]);
    assert.deepEqual(plan[1].classes, ["B", "C", "F"]);
  });

  test("with no durations, balances by the number of test methods", () => {
    const counts = new Map([
      ["Big", 9],
      ["Mid", 5],
      ["Small1", 4],
      ["Small2", 0],
    ]);
    const plan = groups.planGroups(counts, new Map(), 2);
    // Small2 has no test methods of its own and counts as one.
    assert.deepEqual(totals(plan), [10, 9]);
    assert.deepEqual(plan[0].classes, ["Big", "Small2"]);
    assert.deepEqual(plan[1].classes, ["Mid", "Small1"]);
  });

  test("an empty durations file behaves like no file", () => {
    const counts = new Map([
      ["A", 3],
      ["B", 2],
    ]);
    const empty = groups.parseDurations("");
    assert.equal(empty.size, 0);
    assert.deepEqual(groups.planGroups(counts, empty, 2), groups.planGroups(counts, new Map(), 2));
  });

  test("a class missing from the durations weighs its methods at the recorded rate", () => {
    // Recorded: 30 s over 3 methods, so 10 s per method. New has 4 methods: 40 s.
    const counts = new Map([
      ["Known1", 1],
      ["Known2", 2],
      ["New", 4],
    ]);
    const partial = new Map([
      ["Known1", 20],
      ["Known2", 10],
    ]);
    const weights = Object.fromEntries(groups.classWeights(counts, partial).map((w) => [w.name, w.weight]));
    assert.deepEqual(weights, { Known1: 20, Known2: 10, New: 40 });
  });

  test("ignores recorded classes that no longer exist", () => {
    const plan = groups.planGroups(new Map([["A", 1]]), new Map([["A", 5], ["Gone", 500]]), 1);
    assert.deepEqual(plan[0], { weight: 5, classes: ["A"] });
  });

  test("does not depend on input order", () => {
    const reversed = new Map([...classes].reverse());
    assert.deepEqual(groups.planGroups(classes, durations, 3), groups.planGroups(reversed, durations, 3));
  });

  test("leaves extra groups empty when there are fewer classes than groups", () => {
    const plan = groups.planGroups(new Map([["A", 1]]), durations, 3);
    assert.deepEqual(
      plan.map((g) => g.classes),
      [["A"], [], []],
    );
  });
});

test.describe("readDurations", () => {
  test("returns no durations when the file is missing", () => {
    assert.equal(groups.readDurations(path.join(os.tmpdir(), "does-not-exist-1f3c.tsv")).size, 0);
    assert.equal(groups.readDurations(undefined).size, 0);
  });

  test("skips lines that are not <seconds> <class>", () => {
    const file = path.join(tree({ "d.tsv": "10.5\tA\n\nbroken\nx\tB\n2\tC\n" }), "d.tsv");
    assert.deepEqual([...groups.readDurations(file)], [
      ["A", 10.5],
      ["C", 2],
    ]);
  });
});

test.describe("durationsFromReports", () => {
  test("sums suite times per simple class name and folds nested classes into their outer class", () => {
    const suite = (name, time) =>
      `<?xml version="1.0" encoding="UTF-8"?>\n<testsuite xmlns:xsi="x" name="${name}" time="${time}" tests="1">\n</testsuite>\n`;
    const root = tree({
      "server/target/surefire-reports/TEST-com.a.FooTest.xml": suite("com.a.FooTest", "22.25"),
      "server/target/surefire-reports/TEST-com.a.FooTest$Nested.xml": suite("com.a.FooTest$Nested", "1.5"),
      "plugin/target/surefire-reports/TEST-com.b.BarTest.xml": suite("com.b.BarTest", "1,200.4"),
      "other/target/surefire-reports/TEST-com.c.ee.BarTest.xml": suite("com.c.ee.BarTest", "2"),
      "server/target/surefire-reports/com.a.FooTest.txt": "Tests run: 1",
      "server/target/other/TEST-com.d.NotAReport.xml": suite("com.d.NotAReport", "9"),
    });
    assert.equal(groups.durationsFromReports(root), "1202.4\tBarTest\n23.8\tFooTest");
  });

  test("returns nothing when there are no reports", () => {
    assert.equal(groups.durationsFromReports(tree({ "server/pom.xml": "" })), "");
  });
});
