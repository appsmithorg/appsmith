import { z } from "zod";

// D3 create_redis_query — a STRUCTURED Redis command builder, the KV analog of create_query / create_mongo_query.
// The agent never authors a raw Redis command string or raw `{{ }}` bindings. The compiler emits the Redis plugin's
// `actionConfiguration.body` (a single command line) from an allow-listed command + validated single-token args.
//
// Injection model: the Redis plugin (RedisPlugin.getCommandAndArgs) tokenizes the body with the regex
// `"[^"]+"|'[^']+'|\S+` and runs exactly ONE command via `jedis.sendCommand(cmd, args[])` — args are passed as
// SEPARATE arguments, so there is no multi-command / newline injection: the body is always one command. We keep it
// provably one command by (1) allow-listing the command verb, and (2) gating every literal arg to a single token
// with no whitespace / quote / backtick / control char / binding syntax, so each literal matches exactly one `\S+`
// token. A widget arg is emitted as a bare `{{ Widget.prop }}` binding that Appsmith's eval replaces with the
// widget's value BEFORE the plugin tokenizes — still one command (a resolved value containing whitespace only
// changes arg COUNT, a runtime correctness caveat, never the command identity).

// A Redis key/field: a single token from a conservative charset (letters/digits and the usual key punctuation incl.
// `:` for namespacing). No whitespace, quote, backtick, brace, `$`, or control char, so it is exactly one token.
const REDIS_KEY = /^[A-Za-z0-9_:.\-/@#]+$/;
const redisKey = z
  .string()
  .min(1)
  .max(512)
  .regex(
    REDIS_KEY,
    "must be a single-token key (letters, digits, and _ : . - / @ #)",
  );

// A literal value token: any printable single token EXCEPT whitespace, quotes, backtick, and binding/template
// syntax. This admits numbers, ids, and compact JSON-without-spaces while guaranteeing a single `\S+` token that
// cannot open a `{{ }}` binding or a quoted-string tokenization branch.
const RAW_EXPRESSION = /\{\{|\}\}|\$\{|`/;
const redisLiteral = z
  .string()
  .min(1)
  .max(4096)
  .refine((v) => !/[\s"']/.test(v) && !/[\u0000-\u001f]/.test(v), {
    message: "value must be a single token with no whitespace or quotes",
  })
  .refine((v) => !RAW_EXPRESSION.test(v), {
    message: "value must not contain binding/template syntax ({{ }}, ${ }, `)",
  });

// A binding identifier + property path (same vocabulary as the SQL/Mongo builders).
const bindingIdentifier = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_]+$/, "must be alphanumeric/underscore");
const propertyPath = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z_][A-Za-z0-9_.]*$/, "must be a dotted identifier path");

// An arg value: a literal single token OR a widget reference (resolved to the widget's value at runtime).
const valueRef = z.union([
  z.object({ literal: redisLiteral }).strict(),
  z.object({ widget: bindingIdentifier, property: propertyPath }).strict(),
]);

type ValueRef = z.infer<typeof valueRef>;

// A non-negative integer arg (EXPIRE seconds, LRANGE start/stop) — emitted as a bare literal number.
const intArg = z.number().int().min(-1_000_000_000).max(1_000_000_000);

// The closed command set. Grouped by shape so compile knows which args to emit and validate. Read commands are
// side-effect free; write commands mutate. All are single-command, single-line.
export const REDIS_COMMANDS = [
  // key-only
  "GET",
  "EXISTS",
  "TTL",
  "TYPE",
  "STRLEN",
  "LLEN",
  "SMEMBERS",
  "SCARD",
  "HGETALL",
  "HKEYS",
  "HVALS",
  "DEL",
  "INCR",
  "DECR",
  // key + value
  "SET",
  "APPEND",
  "LPUSH",
  "RPUSH",
  "SADD",
  "SREM",
  // key + field
  "HGET",
  "HDEL",
  // key + field + value
  "HSET",
  // key + seconds
  "EXPIRE",
  // key + start + stop
  "LRANGE",
] as const;
export type RedisCommand = (typeof REDIS_COMMANDS)[number];

const KEY_ONLY: ReadonlySet<RedisCommand> = new Set([
  "GET",
  "EXISTS",
  "TTL",
  "TYPE",
  "STRLEN",
  "LLEN",
  "SMEMBERS",
  "SCARD",
  "HGETALL",
  "HKEYS",
  "HVALS",
  "DEL",
  "INCR",
  "DECR",
]);
const KEY_VALUE: ReadonlySet<RedisCommand> = new Set([
  "SET",
  "APPEND",
  "LPUSH",
  "RPUSH",
  "SADD",
  "SREM",
]);
const KEY_FIELD: ReadonlySet<RedisCommand> = new Set(["HGET", "HDEL"]);

export const redisQuerySpecSchema = z
  .object({
    name: bindingIdentifier,
    // No workspaceId: the tool resolves the workspace server-authoritatively from applicationId (cross-tenant guard).
    applicationId: z.string().min(1).max(128),
    pageId: z.string().min(1).max(128),
    datasourceId: z.string().min(1).max(128),
    command: z.enum(REDIS_COMMANDS),
    key: redisKey,
    // Present per command shape: value (SET/APPEND/list/set writes, HSET), field (HGET/HDEL/HSET), seconds (EXPIRE),
    // start+stop (LRANGE). Validated in the refine below.
    value: valueRef.optional(),
    field: redisKey.optional(),
    seconds: intArg.optional(),
    start: intArg.optional(),
    stop: intArg.optional(),
  })
  .strict()
  .superRefine((spec, ctx) => {
    const needs = (
      cond: boolean,
      present: boolean,
      field: string,
      message: string,
    ) => {
      if (cond && !present) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: [field] });
      }

      if (!cond && present) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field} is not valid for ${spec.command}`,
          path: [field],
        });
      }
    };

    const wantsValue = KEY_VALUE.has(spec.command) || spec.command === "HSET";
    const wantsField = KEY_FIELD.has(spec.command) || spec.command === "HSET";

    needs(
      wantsValue,
      spec.value !== undefined,
      "value",
      `${spec.command} requires a value`,
    );
    needs(
      wantsField,
      spec.field !== undefined,
      "field",
      `${spec.command} requires a field`,
    );
    needs(
      spec.command === "EXPIRE",
      spec.seconds !== undefined,
      "seconds",
      "EXPIRE requires seconds",
    );
    needs(
      spec.command === "LRANGE",
      spec.start !== undefined,
      "start",
      "LRANGE requires start",
    );
    needs(
      spec.command === "LRANGE",
      spec.stop !== undefined,
      "stop",
      "LRANGE requires stop",
    );

    // Anything not covered above (key-only commands) must carry no extra args.
    if (
      KEY_ONLY.has(spec.command) &&
      (spec.value !== undefined ||
        spec.field !== undefined ||
        spec.seconds !== undefined ||
        spec.start !== undefined ||
        spec.stop !== undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${spec.command} takes only a key`,
      });
    }
  });

export type RedisQuerySpec = z.infer<typeof redisQuerySpecSchema>;

export interface CompiledRedisQuery {
  // The single command line emitted into actionConfiguration.body.
  body: string;
  // True when any arg is a widget binding, so the tool registers `body` as a dynamic binding path.
  hasBinding: boolean;
}

// Emit one arg token. A literal is emitted verbatim (already gated to a single token); a widget reference becomes a
// bare `{{ Widget.prop }}` mustache that eval resolves to the widget's value before the plugin tokenizes.
function emitArg(value: ValueRef): { token: string; binding: boolean } {
  if ("literal" in value) {
    return { token: value.literal, binding: false };
  }

  return { token: `{{ ${value.widget}.${value.property} }}`, binding: true };
}

export function compileRedisQuery(spec: RedisQuerySpec): CompiledRedisQuery {
  const parts: string[] = [spec.command, spec.key];
  let hasBinding = false;

  const pushArg = (value: ValueRef) => {
    const { binding, token } = emitArg(value);

    parts.push(token);
    hasBinding = hasBinding || binding;
  };

  if (spec.command === "HGET" || spec.command === "HDEL") {
    parts.push(spec.field!);
  } else if (spec.command === "HSET") {
    parts.push(spec.field!);
    pushArg(spec.value!);
  } else if (KEY_VALUE.has(spec.command)) {
    pushArg(spec.value!);
  } else if (spec.command === "EXPIRE") {
    parts.push(String(spec.seconds));
  } else if (spec.command === "LRANGE") {
    parts.push(String(spec.start), String(spec.stop));
  }

  return { body: parts.join(" "), hasBinding };
}

// The Redis plugin reads its command from `actionConfiguration.body`. When the body carries a widget binding, the
// path `body` is registered so eval evaluates it (the same contract the REST/SQL builders use for their bindings).
export function buildRedisActionDto(
  spec: RedisQuerySpec,
  compiled: CompiledRedisQuery,
): Record<string, unknown> {
  return {
    name: spec.name,
    pageId: spec.pageId,
    datasource: { id: spec.datasourceId },
    actionConfiguration: {
      body: compiled.body,
      ...(compiled.hasBinding
        ? { dynamicBindingPathList: [{ key: "body" }] }
        : {}),
    },
  };
}
