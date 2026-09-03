import {
  buildRestActionDto,
  compileRestApi,
  restApiSpecSchema,
} from "./restApi.js";

function parse(spec: unknown) {
  const result = restApiSpecSchema.safeParse(spec);

  if (!result.success) throw new Error("spec did not parse");

  return result.data;
}

const base = {
  name: "getUsers",
  applicationId: "app1",
  pageId: "page1",
  datasourceId: "storedRestDatasource",
  method: "GET",
  path: "/v1/users",
};

describe("compileRestApi — structured REST actions", () => {
  it("compiles safe query parameters and allowlisted headers", () => {
    const compiled = compileRestApi(
      parse({
        ...base,
        queryParameters: [
          { key: "limit", value: { literal: 25 } },
          {
            key: "userId",
            value: { widget: "UsersTable", property: "selectedRow.id" },
          },
        ],
        headers: [
          { key: "Accept", value: "application/json" },
          { key: "Content-Type", value: "application/json" },
        ],
      }),
    );

    expect(compiled).toMatchObject({
      path: "/v1/users",
      queryParameters: [
        { key: "limit", value: "25" },
        { key: "userId", value: "{{ UsersTable.selectedRow.id }}" },
      ],
      headers: [
        { key: "Accept", value: "application/json" },
        { key: "Content-Type", value: "application/json" },
      ],
      body: "",
      bodyFormData: [],
      apiContentType: "none",
    });
  });

  it("appends dynamic path segments from a widget (path '/us' + zip -> /us/{{ ZipInput.text }})", () => {
    const compiled = compileRestApi(
      parse({
        ...base,
        path: "/us",
        pathParams: [{ widget: "ZipInput", property: "text" }],
      }),
    );

    expect(compiled.path).toBe("/us/{{ ZipInput.text }}");
  });

  it("appends literal path segments and mixes them with a widget reference", () => {
    const compiled = compileRestApi(
      parse({
        ...base,
        path: "/api",
        pathParams: [
          { literal: "v2" },
          { widget: "CountrySelect", property: "selectedOptionValue" },
        ],
      }),
    );

    expect(compiled.path).toBe(
      "/api/v2/{{ CountrySelect.selectedOptionValue }}",
    );
  });

  it("rejects unsafe dynamic path segments (template syntax, slashes, raw bindings)", () => {
    for (const literal of ["a/b", "{{evil}}", "..", "a b"]) {
      expect(
        restApiSpecSchema.safeParse({ ...base, pathParams: [{ literal }] })
          .success,
      ).toBe(false);
    }
  });

  it("compiles JSON and form bodies with compiler-authored widget bindings", () => {
    const json = compileRestApi(
      parse({
        ...base,
        method: "PATCH",
        body: {
          type: "json",
          values: {
            name: { literal: "Ada" },
            active: { literal: true },
            userId: { widget: "UsersTable", property: "selectedRow.id" },
          },
        },
      }),
    );
    const form = compileRestApi(
      parse({
        ...base,
        method: "POST",
        body: {
          type: "form",
          fields: [
            { key: "name", value: { literal: "Ada" } },
            {
              key: "userId",
              value: { widget: "UsersTable", property: "selectedRow.id" },
            },
          ],
        },
      }),
    );

    expect(json).toMatchObject({
      body: '{"name":"Ada","active":true,"userId":{{ UsersTable.selectedRow.id }}}',
      bodyFormData: [],
      apiContentType: "application/json",
    });
    expect(form).toMatchObject({
      body: "",
      bodyFormData: [
        { key: "name", value: "Ada" },
        { key: "userId", value: "{{ UsersTable.selectedRow.id }}" },
      ],
      apiContentType: "application/x-www-form-urlencoded",
    });
  });

  it("builds a REST ActionDTO with the stored datasource", () => {
    const spec = parse({
      ...base,
      method: "POST",
      body: { type: "json", values: { name: { literal: "Ada" } } },
    });
    const dto = buildRestActionDto(spec, compileRestApi(spec)) as {
      name: string;
      pageId: string;
      datasource: { id: string };
      actionConfiguration: {
        path: string;
        httpMethod: string;
        httpVersion: string;
        formData: { apiContentType: string };
        body: string;
      };
    };

    expect(dto.name).toBe("getUsers");
    expect(dto.pageId).toBe("page1");
    expect(dto.datasource).toEqual({ id: "storedRestDatasource" });
    expect(dto.actionConfiguration).toMatchObject({
      path: "/v1/users",
      httpMethod: "POST",
      httpVersion: "HTTP11",
      formData: { apiContentType: "application/json" },
      body: '{"name":"Ada"}',
    });
  });
});

describe("restApiSpecSchema — rejects injection and unbounded input", () => {
  const bad: [string, Record<string, unknown>][] = [
    ["absolute URL", { path: "https://attacker.example/users" }],
    ["protocol-relative path", { path: "//attacker.example/users" }],
    ["path traversal", { path: "/v1/../admin" }],
    ["template path", { path: "/v1/{{evil}}" }],
    ["path query string", { path: "/v1/users?admin=true" }],
    ["unsupported method", { method: "OPTIONS" }],
    [
      "raw query binding",
      { queryParameters: [{ key: "id", value: { literal: "{{evil()}}" } }] },
    ],
    [
      "unsafe widget property",
      {
        queryParameters: [
          {
            key: "id",
            value: { widget: "Table1", property: "selectedRow;run()" },
          },
        ],
      },
    ],
    [
      "arbitrary authorization header",
      { headers: [{ key: "Authorization", value: "Bearer secret" }] },
    ],
    [
      "templated header value",
      { headers: [{ key: "Accept", value: "{{evil()}}" }] },
    ],
    [
      "duplicate query key",
      {
        queryParameters: [
          { key: "id", value: { literal: 1 } },
          { key: "id", value: { literal: 2 } },
        ],
      },
    ],
    [
      "inline datasource config",
      { datasourceId: { url: "https://attacker.example" } },
    ],
    // JSON.stringify does not escape U+2028/U+2029, so before RAW_EXPRESSION covered them a literal carrying one
    // landed raw inside the persisted actionConfiguration.body — and assertBodySafe does not catch them either
    // (it only inspects `${`, backticks, and `{{`/`}}` balance).
    [
      "U+2028 line separator in a body literal",
      {
        method: "POST",
        body: {
          type: "json",
          values: { note: { literal: `a${String.fromCharCode(0x2028)}b` } },
        },
      },
    ],
    [
      "U+2029 paragraph separator in a query literal",
      {
        queryParameters: [
          {
            key: "note",
            value: { literal: `a${String.fromCharCode(0x2029)}b` },
          },
        ],
      },
    ],
  ];

  it.each(bad)("rejects %s", (_label, override) => {
    expect(restApiSpecSchema.safeParse({ ...base, ...override }).success).toBe(
      false,
    );
  });

  it("rejects a GET body and oversized compiled body", () => {
    const getWithBody = parse({
      ...base,
      body: { type: "json", values: { id: { literal: 1 } } },
    });
    const oversized = parse({
      ...base,
      method: "POST",
      body: {
        type: "json",
        values: Object.fromEntries(
          Array.from({ length: 10 }, (_, index) => [
            `field${index}`,
            { literal: "x".repeat(1000) },
          ]),
        ),
      },
    });

    expect(() => compileRestApi(getWithBody)).toThrow(
      "GET requests cannot include a body",
    );
    expect(() => compileRestApi(oversized)).toThrow("exceeds the size limit");
  });
});
