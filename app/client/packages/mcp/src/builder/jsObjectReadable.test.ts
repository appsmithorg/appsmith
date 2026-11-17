import { McpGovernanceCoordinator } from "../governance/coordinator.js";
import type {
  McpGovernanceStore,
  McpJsDefinitionRecord,
} from "../governance/store.js";
import { stripOuterParens } from "./jsExpr.js";
import {
  compileJsObject,
  compileJsObjectCode,
  isCompilerAuthoredJsBody,
  jsBodyHash,
  jsObjectDefinitionFromBody,
  jsObjectDefinitionSchema,
  type JsObjectDefinition,
} from "./jsObject.js";

const define = (value: unknown): JsObjectDefinition =>
  jsObjectDefinitionSchema.parse(value);

// Runs a compiled body's function with the given globals and returns its result (or the error message it threw).
async function run(
  body: string,
  fn: string,
  globals: Record<string, unknown>,
  args: unknown[] = [],
): Promise<unknown> {
  const names = Object.keys(globals);
  const object = new Function(
    ...names,
    body.replace("export default", "return"),
  )(...names.map((name) => globals[name])) as Record<
    string,
    (...a: unknown[]) => Promise<unknown>
  >;

  try {
    return await object[fn](...args);
  } catch (error) {
    return `THROW ${(error as Error).message}`;
  }
}

describe("readable layout (one statement per line, no marker)", () => {
  it("lays out members, statements and blocks with tabs", () => {
    const body = compileJsObject(
      define({
        constants: { limit: 5 },
        functions: [
          { name: "empty" },
          {
            name: "check",
            params: ["n"],
            steps: [
              {
                if: { op: "lt", args: [{ param: "n" }, 0] },
                then: [{ return: "negative" }],
                else: [
                  {
                    if: { op: "eq", args: [{ param: "n" }, 0] },
                    then: [{ return: "zero" }],
                    else: [{ return: "positive" }],
                  },
                ],
              },
            ],
          },
          {
            name: "total",
            params: ["rows"],
            steps: [
              { let: "sum", value: 0 },
              {
                forEach: { param: "rows" },
                as: "row",
                do: [
                  {
                    set: "sum",
                    value: { op: "add", args: [{ var: "sum" }, 1] },
                  },
                ],
              },
              { return: { var: "sum" } },
            ],
          },
        ],
      }),
      { readable: true },
    );

    expect(body).toBe(
      [
        "export default {",
        "\tlimit: 5,",
        "",
        "\tempty: async function () {",
        "\t},",
        "",
        "\tcheck: async function (n) {",
        "\t\tif (n < 0) {",
        '\t\t\treturn "negative";',
        "\t\t} else if (n === 0) {",
        '\t\t\treturn "zero";',
        "\t\t} else {",
        '\t\t\treturn "positive";',
        "\t\t}",
        "\t},",
        "",
        "\ttotal: async function (rows) {",
        "\t\tlet sum = 0;",
        "\t\tfor (let row of (Array.isArray(rows) ? rows : [])) {",
        "\t\t\tsum = sum + 1;",
        "\t\t}",
        "\t\treturn sum;",
        "\t},",
        "};",
        "",
      ].join("\n"),
    );
    expect(isCompilerAuthoredJsBody(body)).toBe(false);
  });

  it("lays out a query run with an error branch, with and without parameters", () => {
    const body = compileJsObject(
      define({
        functions: [
          {
            name: "load",
            steps: [
              {
                run: "GetRows",
                into: "rows",
                onError: [{ showAlert: "Could not load", style: "error" }],
              },
              {
                run: "SaveRow",
                with: { id: { var: "rows" } },
                onError: [{ return: false }],
              },
            ],
          },
        ],
      }),
      { readable: true },
    );

    expect(body).toContain(
      [
        "\t\tlet rows;",
        "\t\ttry {",
        "\t\t\trows = await GetRows.run();",
        "\t\t} catch ($e) {",
        '\t\t\tshowAlert("Could not load", "error");',
        "\t\t}",
        "\t\t{",
        "\t\t\tconst $a = ",
      ].join("\n"),
    );
    expect(body).toContain(
      [
        "\t\t\ttry {",
        "\t\t\t\tawait SaveRow.run($a);",
        "\t\t\t} catch ($e) {",
        "\t\t\t\treturn false;",
        "\t\t\t}",
        "\t\t}",
      ].join("\n"),
    );
  });

  it("calls a sibling directly, but keeps the depth guard on a call into another object", () => {
    const body = compileJsObject(
      define({
        functions: [
          {
            name: "a",
            steps: [{ call: "b", into: "x" }, { return: { var: "x" } }],
          },
          {
            name: "b",
            returns: { call: { object: "Other", function: "c" } },
          },
        ],
      }),
      { readable: true },
    );

    expect(body).toContain("\t\tlet x = await this.b();\n");
    expect(body).toContain("mcpCallDepth");
    expect(body).toContain("return await Other.c();");
  });

  it("leaves the one-line layout untouched", () => {
    const definition = define({
      functions: [
        {
          name: "a",
          params: ["v"],
          returns: {
            fn: "isoString",
            args: [{ fn: "date", args: [{ param: "v" }] }],
          },
        },
      ],
    });

    expect(compileJsObjectCode(definition)).toBe(
      "export default { a: async function (v) { return new Date(new Date(v)).toISOString(); } };",
    );
    expect(compileJsObject(definition)).toContain(" /* mcp-spec:");
  });

  it("runs exactly like the one-line layout", async () => {
    // Exercises every template the readable layout shortens: plain-read isEmpty, date/isoString/isValidDate on
    // dates, text coercion, literal slice indexes, array guards on plain reads and on arrays, and sibling calls.
    const definition = define({
      constants: { dayMs: 86400000 },
      functions: [
        {
          name: "shift",
          params: ["value", "days"],
          steps: [
            {
              if: { fn: "isEmpty", args: [{ param: "value" }] },
              then: [{ return: null }],
            },
            {
              let: "ms",
              value: {
                op: "add",
                args: [
                  {
                    fn: "number",
                    args: [{ fn: "date", args: [{ param: "value" }] }],
                  },
                  {
                    op: "mul",
                    args: [{ param: "days" }, { constant: "dayMs" }],
                  },
                ],
              },
            },
            {
              if: {
                op: "not",
                args: [
                  {
                    fn: "isValidDate",
                    args: [{ fn: "date", args: [{ var: "ms" }] }],
                  },
                ],
              },
              then: [{ return: "invalid" }],
            },
            {
              return: {
                fn: "isoString",
                args: [{ fn: "date", args: [{ var: "ms" }] }],
              },
            },
          ],
        },
        {
          name: "label",
          params: ["value"],
          steps: [
            {
              let: "parts",
              value: {
                fn: "split",
                args: [{ fn: "string", args: [{ param: "value" }] }, "-"],
              },
            },
            { call: "shift", args: [{ param: "value" }, 1], into: "next" },
            {
              return: {
                fn: "concat",
                args: [
                  { fn: "first", args: [{ var: "parts" }] },
                  "/",
                  {
                    fn: "join",
                    args: [{ fn: "slice", args: [{ var: "parts" }, 1] }, "-"],
                  },
                  "/",
                  { var: "next" },
                  "/",
                  {
                    fn: "concat",
                    args: [
                      {
                        fn: "isEmpty",
                        args: [{ widget: "Inp", property: "text" }],
                      },
                      { fn: "isoString", args: [{ fn: "now", args: [] }] },
                      { fn: "first", args: [{ param: "value" }] },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
    });
    const oneLine = compileJsObjectCode(definition);
    const readable = compileJsObject(definition, { readable: true });
    const RealDate = Date;
    const fixedNow = RealDate.UTC(2026, 10, 1, 12);

    class FixedDate extends RealDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) super(fixedNow);
        else super(...(args as [string]));
      }
    }

    expect(readable).not.toBe(oneLine);

    for (const value of [
      undefined,
      null,
      "",
      "2027-03-15",
      "garbage",
      1798761600000,
      [],
      ["x"],
    ]) {
      for (const text of [undefined, "", "a"]) {
        const globals = { Date: FixedDate, Inp: { text } };

        expect(await run(readable, "label", globals, [value])).toEqual(
          await run(oneLine, "label", globals, [value]),
        );
        expect(await run(readable, "shift", globals, [value, 2])).toEqual(
          await run(oneLine, "shift", globals, [value, 2]),
        );
      }
    }
  });
});

describe("stripOuterParens", () => {
  it.each([
    ["(a + b)", "a + b"],
    ["((a))", "(a)"],
    ["(a) + (b)", "(a) + (b)"],
    ['(")" + x)', '")" + x'],
    ['(x === "(")', 'x === "("'],
    ['("\\")" + (y))', '"\\")" + (y)'],
    ["a", "a"],
    ["", ""],
  ])("%s → %s", (input, output) => {
    expect(stripOuterParens(input)).toBe(output);
  });
});

describe("definitions kept by the governance store", () => {
  function storeWithDefinitions(): McpGovernanceStore & {
    definitions: McpJsDefinitionRecord[];
  } {
    const definitions: McpJsDefinitionRecord[] = [];

    return {
      definitions,
      acquireLock: async () => "lock",
      releaseLock: async () => {},
      createConfirmation: async () => {},
      consumeConfirmation: async () => undefined,
      peekConfirmation: async () => undefined,
      saveChange: async () => {},
      getChange: async () => undefined,
      listChanges: async () => [],
      getAnyChange: async () => undefined,
      listAllChanges: async () => [],
      saveJsDefinition: async (record) => {
        definitions.push(record);
      },
      // Deliberately unscoped, so the coordinator's own organization check is what the test exercises.
      findJsDefinitions: async (_organizationId, hashes) =>
        definitions.filter((d) => hashes.includes(d.codeHash)),
    };
  }

  const definition = define({
    functions: [{ name: "a", returns: { fn: "trim", args: [" x "] } }],
  });
  const body = compileJsObject(definition, { readable: true });

  it("saves a definition by body hash and loads it back for its own organization only", async () => {
    const store = storeWithDefinitions();
    const coordinator = new McpGovernanceCoordinator(store);

    expect(coordinator.supportsJsDefinitions).toBe(true);
    await coordinator.saveJsDefinition("org1", body, definition);
    expect(store.definitions[0]).toEqual(
      expect.objectContaining({
        organizationId: "org1",
        codeHash: jsBodyHash(body),
      }),
    );

    // Nothing is cached in the process: the body alone is never recognised.
    expect(isCompilerAuthoredJsBody(body)).toBe(false);
    expect(jsObjectDefinitionFromBody(body)).toBeUndefined();

    // org2 never sees org1's record, even when it was loaded for org1 first in the same process.
    expect(
      (await coordinator.loadJsDefinitions("org1", [body])).get(
        jsBodyHash(body),
      ),
    ).toEqual(definition);
    expect((await coordinator.loadJsDefinitions("org2", [body])).size).toBe(0);
    expect(
      (await coordinator.loadJsDefinitions("org1", [`${body} `])).size,
    ).toBe(0);
  });

  it("ignores a stored record that is not a valid definition", async () => {
    const store = storeWithDefinitions();
    const coordinator = new McpGovernanceCoordinator(store);

    store.definitions.push(
      {
        organizationId: "org1",
        codeHash: jsBodyHash(body),
        definition: '{"functions":[{"name":"constructor"}]}',
        createdAt: new Date(),
      },
      {
        organizationId: "org1",
        codeHash: jsBodyHash("other"),
        definition: "not json",
        createdAt: new Date(),
      },
    );
    expect(
      (await coordinator.loadJsDefinitions("org1", [body, "other"])).size,
    ).toBe(0);
  });

  it("refuses to save without an organization, over 256 KB, off-schema, or for a body the definition does not compile to", async () => {
    const store = storeWithDefinitions();
    const coordinator = new McpGovernanceCoordinator(store);

    await expect(
      coordinator.saveJsDefinition("", body, definition),
    ).rejects.toThrow("per organization");
    await expect(
      coordinator.saveJsDefinition(
        "org1",
        "x".repeat(256 * 1024 + 1),
        definition,
      ),
    ).rejects.toThrow("larger than 256 KB");
    await expect(
      coordinator.saveJsDefinition("org1", body, {
        functions: [{ name: "constructor" }],
      } as never),
    ).rejects.toThrow("does not match its schema");
    // A valid definition saved under another body's hash would make that body read as MCP-written.
    await expect(
      coordinator.saveJsDefinition("org1", `${body}// edited\n`, definition),
    ).rejects.toThrow("does not compile to this body");
    expect(store.definitions).toHaveLength(0);
    expect((await coordinator.loadJsDefinitions("", [body])).size).toBe(0);
  });

  it("reports no support, and refuses to save, when the store has no definition methods", async () => {
    const plain: McpGovernanceStore = { ...storeWithDefinitions() };

    delete plain.findJsDefinitions;
    delete plain.saveJsDefinition;
    const coordinator = new McpGovernanceCoordinator(plain);

    expect(coordinator.supportsJsDefinitions).toBe(false);
    await expect(
      coordinator.saveJsDefinition("org1", body, definition),
    ).rejects.toThrow("does not keep JS definitions");
    expect((await coordinator.loadJsDefinitions("org1", [body])).size).toBe(0);
  });
});
