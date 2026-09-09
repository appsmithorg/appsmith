import {
  buildGraphqlActionDto,
  compileGraphqlQuery,
  graphqlQuerySpecSchema,
} from "./graphqlQuery.js";

function parse(query: unknown) {
  return graphqlQuerySpecSchema.safeParse(query);
}

const base = {
  name: "GqlQ",
  applicationId: "app1",
  pageId: "p1",
  datasourceId: "ds1",
};

describe("create_graphql_query builder", () => {
  it("compiles a query with no variables (minified braces allowed)", () => {
    const parsed = parse({
      ...base,
      query: "query { viewer { id name } }",
    });

    expect(parsed.success).toBe(true);
    const compiled = compileGraphqlQuery(parsed.data!);

    expect(compiled.body).toBe("query { viewer { id name } }");
    expect(compiled.variables).toBe("");
    expect(compiled.hasBinding).toBe(false);

    const dto = buildGraphqlActionDto(parsed.data!, compiled) as {
      actionConfiguration: {
        httpMethod: string;
        pluginSpecifiedTemplates: { value: unknown }[];
        dynamicBindingPathList?: unknown;
      };
    };

    expect(dto.actionConfiguration.httpMethod).toBe("POST");
    // [0] JSON smart substitution ON, [1] empty variables, [2] pagination.
    expect(dto.actionConfiguration.pluginSpecifiedTemplates[0].value).toBe(
      true,
    );
    expect(dto.actionConfiguration.pluginSpecifiedTemplates[1].value).toBe("");
    expect("dynamicBindingPathList" in dto.actionConfiguration).toBe(false);
  });

  it("allows closing '}}' (GraphQL) while blocking a '{{' binding open", () => {
    // Adjacent closing braces are valid GraphQL and must be accepted.
    expect(parse({ ...base, query: "{ user { id }}" }).success).toBe(true);
    // A binding-open sequence must be rejected.
    expect(
      parse({ ...base, query: "{ user(id: {{Evil.x}}) { id } }" }).success,
    ).toBe(false);
  });

  it("compiles variables — literals JSON-encoded, widget refs as smart-sub mustaches", () => {
    const parsed = parse({
      ...base,
      query: "query($id: ID!, $active: Boolean) { user(id: $id) { id } }",
      variables: [
        { name: "id", value: { widget: "Row", property: "selectedRow.id" } },
        { name: "active", value: { literal: true } },
      ],
    });

    expect(parsed.success).toBe(true);
    const compiled = compileGraphqlQuery(parsed.data!);

    expect(compiled.variables).toBe(
      '{ "id": {{ Row.selectedRow.id }}, "active": true }',
    );
    expect(compiled.hasBinding).toBe(true);

    const dto = buildGraphqlActionDto(parsed.data!, compiled) as {
      actionConfiguration: {
        pluginSpecifiedTemplates: { value: unknown }[];
        dynamicBindingPathList?: { key: string }[];
      };
    };

    expect(dto.actionConfiguration.pluginSpecifiedTemplates[1].value).toBe(
      '{ "id": {{ Row.selectedRow.id }}, "active": true }',
    );
    // The variables field carries the binding.
    expect(dto.actionConfiguration.dynamicBindingPathList).toEqual([
      { key: "pluginSpecifiedTemplates[1].value" },
    ]);
  });

  it("all-literal variables produce a non-empty map and no binding path", () => {
    const parsed = parse({
      ...base,
      query: "query($n: Int) { items(first: $n) { id } }",
      variables: [{ name: "n", value: { literal: 10 } }],
    });

    expect(parsed.success).toBe(true);
    const compiled = compileGraphqlQuery(parsed.data!);

    expect(compiled.variables).toBe('{ "n": 10 }');
    expect(compiled.hasBinding).toBe(false);

    const dto = buildGraphqlActionDto(parsed.data!, compiled) as {
      actionConfiguration: { dynamicBindingPathList?: unknown };
    };

    expect("dynamicBindingPathList" in dto.actionConfiguration).toBe(false);
  });

  it("rejects unsafe specs", () => {
    const bad: unknown[] = [
      // template syntax in the query.
      { ...base, query: "query { a(x: ${evil}) }" },
      // backtick in the query.
      { ...base, query: "query { a(x: `evil`) }" },
      // not a GraphQL operation (doesn't start with { / query / mutation / subscription).
      { ...base, query: "SELECT * FROM users" },
      // variable name charset.
      {
        ...base,
        query: "query { a }",
        variables: [{ name: "bad name", value: { literal: 1 } }],
      },
      // binding syntax in a literal variable value.
      {
        ...base,
        query: "query { a }",
        variables: [{ name: "x", value: { literal: "{{evil}}" } }],
      },
      // widget property path charset.
      {
        ...base,
        query: "query { a }",
        variables: [
          { name: "x", value: { widget: "In", property: "a; drop" } },
        ],
      },
    ];

    for (const spec of bad) {
      expect(parse(spec).success).toBe(false);
    }
  });
});
