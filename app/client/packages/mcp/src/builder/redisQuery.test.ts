import {
  buildRedisActionDto,
  compileRedisQuery,
  redisQuerySpecSchema,
} from "./redisQuery.js";

function parse(query: unknown) {
  return redisQuerySpecSchema.safeParse(query);
}

const base = {
  name: "RedisQ",
  applicationId: "app1",
  pageId: "page1",
  datasourceId: "ds1",
};

describe("create_redis_query builder", () => {
  it("compiles a key-only read command", () => {
    const parsed = parse({ ...base, command: "GET", key: "user:42" });

    expect(parsed.success).toBe(true);
    const compiled = compileRedisQuery(parsed.data!);

    expect(compiled.body).toBe("GET user:42");
    expect(compiled.hasBinding).toBe(false);
  });

  it("compiles a SET with a literal value (single command line)", () => {
    const parsed = parse({
      ...base,
      command: "SET",
      key: "counter",
      value: { literal: "100" },
    });

    expect(parsed.success).toBe(true);
    expect(compileRedisQuery(parsed.data!).body).toBe("SET counter 100");
  });

  it("compiles HSET (key + field + value) and EXPIRE (key + seconds)", () => {
    const hset = parse({
      ...base,
      command: "HSET",
      key: "h",
      field: "name",
      value: { literal: "ada" },
    });

    expect(hset.success).toBe(true);
    expect(compileRedisQuery(hset.data!).body).toBe("HSET h name ada");

    const expire = parse({
      ...base,
      command: "EXPIRE",
      key: "h",
      seconds: 60,
    });

    expect(expire.success).toBe(true);
    expect(compileRedisQuery(expire.data!).body).toBe("EXPIRE h 60");
  });

  it("compiles HGET/HDEL (key + field, no value) and omits the binding path", () => {
    const hget = parse({ ...base, command: "HGET", key: "h", field: "name" });

    expect(hget.success).toBe(true);
    const compiled = compileRedisQuery(hget.data!);

    expect(compiled.body).toBe("HGET h name");
    expect(compiled.hasBinding).toBe(false);

    // A literal-only command must NOT register a body binding.
    const dto = buildRedisActionDto(hget.data!, compiled) as {
      actionConfiguration: { dynamicBindingPathList?: unknown };
    };

    expect("dynamicBindingPathList" in dto.actionConfiguration).toBe(false);

    const hdel = parse({ ...base, command: "HDEL", key: "h", field: "name" });

    expect(hdel.success).toBe(true);
    expect(compileRedisQuery(hdel.data!).body).toBe("HDEL h name");
  });

  it("compiles LRANGE (key + start + stop)", () => {
    const parsed = parse({
      ...base,
      command: "LRANGE",
      key: "list",
      start: 0,
      stop: -1,
    });

    expect(parsed.success).toBe(true);
    expect(compileRedisQuery(parsed.data!).body).toBe("LRANGE list 0 -1");
  });

  it("emits a widget-bound value as a mustache and registers the body binding", () => {
    const parsed = parse({
      ...base,
      command: "SET",
      key: "greeting",
      value: { widget: "Input1", property: "text" },
    });

    expect(parsed.success).toBe(true);
    const compiled = compileRedisQuery(parsed.data!);

    expect(compiled.body).toBe("SET greeting {{ Input1.text }}");
    expect(compiled.hasBinding).toBe(true);

    const dto = buildRedisActionDto(parsed.data!, compiled) as {
      actionConfiguration: {
        body: string;
        dynamicBindingPathList?: { key: string }[];
      };
    };

    expect(dto.actionConfiguration.dynamicBindingPathList).toEqual([
      { key: "body" },
    ]);
  });

  it("rejects unsafe args and mismatched command shapes", () => {
    const bad: unknown[] = [
      // whitespace in a literal value would split into extra Redis args.
      { ...base, command: "SET", key: "k", value: { literal: "hello world" } },
      // binding syntax must never survive into a literal.
      { ...base, command: "SET", key: "k", value: { literal: "{{evil}}" } },
      // key charset (a space breaks tokenization).
      { ...base, command: "GET", key: "bad key" },
      // a quote in a value.
      { ...base, command: "SET", key: "k", value: { literal: 'a"b' } },
      // SET requires a value.
      { ...base, command: "SET", key: "k" },
      // GET takes only a key.
      { ...base, command: "GET", key: "k", value: { literal: "x" } },
      // unknown command.
      { ...base, command: "FLUSHALL", key: "k" },
      // EXPIRE requires seconds.
      { ...base, command: "EXPIRE", key: "k" },
      // widget property path charset.
      {
        ...base,
        command: "SET",
        key: "k",
        value: { widget: "Input1", property: "text; DROP" },
      },
    ];

    for (const spec of bad) {
      expect(parse(spec).success).toBe(false);
    }
  });
});
