import { z } from "zod";

// D4 create_graphql_query — a STRUCTURED GraphQL builder. A GraphQL operation is itself a query language, so unlike
// SQL/Mongo the compiler cannot synthesize the whole operation; instead it accepts the operation STRING plus a
// separate, structured VARIABLES map. Runtime data enters ONLY through variables, which GraphQL parameterizes (the
// query references `$name`, the variables JSON carries the value) — the query string never string-interpolates
// runtime data. This mirrors the existing create_rest_api posture (the agent supplies a request body) and the
// GraphQL plugin stores it as a REST POST: actionConfiguration.body = the query, pluginSpecifiedTemplates[0] = JSON
// smart substitution (forced ON → bound variable values are JSON-encoded, not concatenated), [1] = the variables.
//
// Binding-injection gate: the query is sent as the POST body, which Appsmith eval scans for `{{ }}` bindings. So the
// query is gated against a binding-OPEN sequence (`{{`), template syntax (`${`), and backtick — but NOT `}}`, which
// is a legitimate GraphQL closing-brace pair (a binding requires the `{{` open, which is blocked). Variable values
// are literals (JSON-encoded) or widget references (`{{ Widget.prop }}`, parameterized by smart substitution).

// A GraphQL query/mutation string. Blocks the binding-open `{{`, template `${`, and backtick so it can never become
// an Appsmith binding; `}}`, `{`, and `$name` (GraphQL variable syntax) are allowed.
const GRAPHQL_BINDING_OPEN = /\{\{|\$\{|`/;
const graphqlOperation = z
  .string()
  .trim()
  .min(1)
  .max(8000)
  .refine((v) => !GRAPHQL_BINDING_OPEN.test(v), {
    message:
      "query must not contain binding/template syntax ({{ , ${ , or backtick)",
  })
  // A GraphQL operation starts with a selection set or the query/mutation/subscription keyword.
  .refine((v) => /^(\{|query\b|mutation\b|subscription\b)/.test(v.trim()), {
    message:
      "query must be a GraphQL operation (start with '{', 'query', 'mutation', or 'subscription')",
  });

// A GraphQL variable name: a plain identifier (matches the `$name` referenced in the operation). Safe to embed as a
// JSON object key.
const variableName = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "variable name must be an identifier");

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

const RAW_EXPRESSION = /\{\{|\}\}|\$\{|`/;
// Belt-and-suspenders [council R2]: every compiler-emitted widget binding must match this exact shape (identity dot
// property-path), mirroring restApi.ts's SAFE_BINDING. The bindingIdentifier/propertyPath charsets already guarantee
// it; this is a final assertion so a future charset change can't silently loosen the emitted binding.
const SAFE_BINDING =
  /^\{\{ [A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_.]* \}\}$/;
// A variable value — a literal scalar (JSON-encoded, no binding syntax) or a widget reference (parameterized).
const valueRef = z.union([
  z
    .object({
      literal: z.union([
        z
          .string()
          .max(4000)
          .refine((v) => !RAW_EXPRESSION.test(v), {
            message: "must not contain binding/template syntax",
          }),
        z.number(),
        z.boolean(),
        z.null(),
      ]),
    })
    .strict(),
  z.object({ widget: bindingIdentifier, property: propertyPath }).strict(),
]);

export const graphqlQuerySpecSchema = z
  .object({
    name: bindingIdentifier,
    applicationId: z.string().min(1).max(128),
    pageId: z.string().min(1).max(128),
    datasourceId: z.string().min(1).max(128),
    query: graphqlOperation,
    // The operation's variables ($name in the query). Each value is a literal or a widget reference.
    variables: z
      .array(z.object({ name: variableName, value: valueRef }).strict())
      .max(50)
      .optional(),
  })
  .strict();

export type GraphqlQuerySpec = z.infer<typeof graphqlQuerySpecSchema>;

export interface CompiledGraphqlQuery {
  body: string;
  variables: string;
  hasBinding: boolean;
}

// Build the JSON-string variables map. A literal is embedded via JSON.stringify (quotes/backslashes escaped, so it
// cannot break out of its JSON position); a widget reference is a bare `{{ Widget.prop }}` value that smart
// substitution JSON-encodes at runtime.
function compileVariables(spec: GraphqlQuerySpec): {
  variables: string;
  hasBinding: boolean;
} {
  if (spec.variables === undefined || spec.variables.length === 0) {
    return { variables: "", hasBinding: false };
  }

  let hasBinding = false;
  const parts = spec.variables.map(({ name, value }) => {
    const key = JSON.stringify(name);

    if ("literal" in value) {
      return `${key}: ${JSON.stringify(value.literal)}`;
    }

    hasBinding = true;

    // A bare mustache value (unquoted) so smart substitution supplies correct JSON typing at runtime.
    const binding = `{{ ${value.widget}.${value.property} }}`;

    if (!SAFE_BINDING.test(binding)) {
      throw new Error("internal: emitted an unsafe variable binding");
    }

    return `${key}: ${binding}`;
  });

  return { variables: `{ ${parts.join(", ")} }`, hasBinding };
}

export function compileGraphqlQuery(
  spec: GraphqlQuerySpec,
): CompiledGraphqlQuery {
  const { hasBinding, variables } = compileVariables(spec);

  return { body: spec.query, variables, hasBinding };
}

// The GraphQL plugin stores a REST POST: body = the operation; pluginSpecifiedTemplates[0] = JSON smart
// substitution (ON so bound variables are parameterized), [1] = the variables JSON, [2] = pagination (unused).
export function buildGraphqlActionDto(
  spec: GraphqlQuerySpec,
  compiled: CompiledGraphqlQuery,
): Record<string, unknown> {
  const dynamicBindingPathList = compiled.hasBinding
    ? [{ key: "pluginSpecifiedTemplates[1].value" }]
    : [];

  // A GraphQL query (read) is safe to run on page load so a bound widget populates without a manual trigger; a
  // mutation/subscription stays manual. The operation string's leading keyword is the signal ('{' is shorthand for
  // a query).
  const trimmed = compiled.body.trimStart();
  const isQuery = trimmed.startsWith("query") || trimmed.startsWith("{");

  return {
    name: spec.name,
    pageId: spec.pageId,
    datasource: { id: spec.datasourceId },
    executeOnLoad: isQuery,
    actionConfiguration: {
      httpMethod: "POST",
      headers: [{ key: "Content-Type", value: "application/json" }],
      body: compiled.body,
      formData: { apiContentType: "json" },
      pluginSpecifiedTemplates: [
        { value: true },
        { value: compiled.variables },
        { value: {} },
      ],
      ...(dynamicBindingPathList.length > 0 ? { dynamicBindingPathList } : {}),
    },
  };
}
