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

test.describe("discoverTestClasses", () => {
  test("selects surefire's default test file names under src/test/java", () => {
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
    assert.deepEqual(groups.discoverTestClasses(root), [
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
    assert.deepEqual(groups.discoverTestClasses(root), ["PluginTest"]);
  });

  test("lists a simple name once when two packages share it", () => {
    const root = tree({
      "server/src/test/java/com/a/PluginServiceTest.java": "",
      "server/src/test/java/com/a/ee/PluginServiceTest.java": "",
    });
    assert.deepEqual(groups.discoverTestClasses(root), ["PluginServiceTest"]);
  });
});

test.describe("planGroups", () => {
  const durations = new Map([
    ["A", 60],
    ["B", 50],
    ["C", 40],
    ["D", 30],
    ["E", 20],
    ["F", 10],
  ]);

  test("every class lands in exactly one group", () => {
    const classes = ["A", "B", "C", "D", "E", "F", "New1", "New2"];
    const plan = groups.planGroups(classes, durations, 3);
    const all = plan.flatMap((g) => g.classes).sort();
    assert.deepEqual(all, classes);
  });

  test("balances by duration, longest first", () => {
    const plan = groups.planGroups(["A", "B", "C", "D", "E", "F"], durations, 2);
    assert.deepEqual(
      plan.map((g) => g.seconds),
      [110, 100],
    );
    assert.deepEqual(plan[0].classes, ["A", "D", "E"]);
    assert.deepEqual(plan[1].classes, ["B", "C", "F"]);
  });

  test("gives a class with no recorded duration the median duration", () => {
    const plan = groups.planGroups(["A", "B", "C", "New"], new Map([["A", 10], ["B", 20], ["C", 30]]), 1);
    assert.equal(plan[0].seconds, 80);
  });

  test("does not depend on input order", () => {
    const one = groups.planGroups(["A", "B", "C", "D", "E", "F"], durations, 3);
    const two = groups.planGroups(["F", "E", "D", "C", "B", "A"], durations, 3);
    assert.deepEqual(one, two);
  });

  test("leaves extra groups empty when there are fewer classes than groups", () => {
    const plan = groups.planGroups(["A"], durations, 3);
    assert.deepEqual(
      plan.map((g) => g.classes),
      [["A"], [], []],
    );
  });
});

test.describe("readDurations", () => {
  test("a later file overrides an earlier one", () => {
    const dir = tree({ "ce.tsv": "10.0\tA\n5.0\tB\n", "ee.tsv": "30.0\tA\n" });
    assert.deepEqual([...groups.readDurations(dir)], [
      ["A", 30],
      ["B", 5],
    ]);
  });

  test("returns no durations when the directory is missing", () => {
    assert.equal(groups.readDurations(path.join(os.tmpdir(), "does-not-exist-1f3c")).size, 0);
  });
});

test.describe("durationsFromSurefireLog", () => {
  test("sums per simple class name and folds nested classes into their outer class", () => {
    const log = [
      "2026-10-27T17:20:27Z [INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 22.25 s -- in com.a.FooTest",
      "2026-10-27T17:20:28Z [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.5 s -- in com.a.FooTest$Nested",
      "2026-10-27T17:20:29Z [ERROR] Tests run: 8, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 1,200.4 s <<< FAILURE! -- in com.b.BarTest",
      "2026-10-27T17:20:30Z [INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2 s -- in com.c.ee.BarTest",
      "2026-10-27T17:20:31Z [INFO] Tests run: 400, Failures: 0, Errors: 0, Skipped: 0",
    ].join("\n");
    assert.equal(groups.durationsFromSurefireLog(log), "1202.4\tBarTest\n23.8\tFooTest");
  });
});
