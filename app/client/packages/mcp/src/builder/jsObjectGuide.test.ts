import { getInstructionDoc, INSTRUCTION_DOCS } from "./instructions.js";
import {
  EXPR_MAX_NODES,
  FN_NAMES,
  OPS,
  PARAMS_MAX,
  SEPARATOR_NAMES,
  STEPS_MAX,
} from "./jsExpr.js";
import {
  compileJsObject,
  jsObjectDefinitionFromBody,
  jsObjectDefinitionSchema,
} from "./jsObject.js";
import {
  FN_GROUPS,
  JS_OBJECT_GUIDE_EXAMPLES,
  renderJsObjectsGuide,
} from "./jsObjectGuide.js";

describe("js-objects guide — rendered from the grammar, examples that really compile", () => {
  const guide = renderJsObjectsGuide();

  it("is registered as a guide and served by get_guide's registry", () => {
    const doc = getInstructionDoc("js-objects");

    expect(doc).toBeDefined();
    expect(INSTRUCTION_DOCS).toContain(doc);
    expect(doc!.render()).toBe(guide);
  });

  it("names every function, operator and separator the compiler accepts", () => {
    for (const name of [...FN_NAMES, ...OPS, ...SEPARATOR_NAMES]) {
      expect(guide).toContain(`| \`${name}\` |`);
    }
  });

  it("states the current bounds rather than stale numbers", () => {
    expect(guide).toContain(`at most ${STEPS_MAX} in a function`);
    expect(guide).toContain(`at most ${EXPR_MAX_NODES} nodes`);
    expect(guide).toContain(`up to ${PARAMS_MAX} names`);
  });

  it("lists every function exactly once across the groups", () => {
    const grouped = FN_GROUPS.flatMap((group) => group.names);

    expect([...grouped].sort()).toEqual([...FN_NAMES].sort());
  });

  it.each(
    JS_OBJECT_GUIDE_EXAMPLES.map((e) => [e.title, e.definition] as const),
  )(
    "example %s is a valid definition that compiles and round-trips",
    (_title, definition) => {
      const parsed = jsObjectDefinitionSchema.safeParse(definition);

      expect(parsed.success).toBe(true);

      const body = compileJsObject(definition);

      expect(body).not.toMatch(/\{\{|\}\}|\$\{|`/);
      expect(jsObjectDefinitionFromBody(body)).toEqual(definition);
      // The rendered guide shows the example verbatim.
      expect(guide).toContain(JSON.stringify(definition, null, 2));
    },
  );

  it("covers every statement kind and every leaf kind in its examples", () => {
    const text = JSON.stringify(JS_OBJECT_GUIDE_EXAMPLES);

    for (const key of [
      '"let"',
      '"set"',
      '"run"',
      '"with"',
      '"into"',
      '"if"',
      '"then"',
      '"else"',
      '"forEach"',
      '"throw"',
      '"return"',
      '"showAlert"',
      '"storeValue"',
      '"resetWidget"',
      '"call"',
      '"showModal"',
      '"closeModal"',
      '"navigate"',
      '"onError"',
      '"table"',
      '"column"',
      '"param"',
      '"var"',
      '"item"',
      '"widget"',
      '"constant"',
      '"store"',
      '"object"',
      '"array"',
      '"query"',
      '"field"',
      '"sep"',
    ]) {
      expect(text).toContain(key);
    }
  });

  it("maps the Ask AI JavaScript idioms and says what is not available", () => {
    for (const idiom of [
      "GetUser.run({ id: Input1.text })",
      "storeValue('userName', Input1.text)",
      "appsmith.store.userName",
      'showAlert("Saved", "success")',
      "parseInt(Input1.text)",
      "new Date(x)",
      "user?.profile?.name",
      'x ?? "Guest"',
      "arr.map(u => u.name)",
      "try { … } catch",
      "navigateTo",
      "moment",
    ]) {
      expect(guide).toContain(idiom);
    }
  });
});
