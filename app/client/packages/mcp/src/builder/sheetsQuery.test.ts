import {
  buildSheetsActionDto,
  compileSheetsQuery,
  sheetsQuerySpecSchema,
} from "./sheetsQuery.js";

function parse(spec: unknown) {
  const result = sheetsQuerySpecSchema.safeParse(spec);

  if (!result.success) throw new Error("spec did not parse");

  return result.data;
}

const base = {
  name: "sheetRows",
  applicationId: "app1",
  pageId: "p1",
  datasourceId: "ds1",
  sheetUrl: "https://docs.google.com/spreadsheets/d/1AbC_dEf-123/edit",
  sheetName: "Sheet1",
};

function formData(dto: unknown): Record<string, { data: unknown }> {
  return (
    dto as {
      actionConfiguration: { formData: Record<string, { data: unknown }> };
    }
  ).actionConfiguration.formData;
}

describe("compileSheetsQuery — structured Sheets read/append", () => {
  it("compiles a read to a FETCH_MANY command", () => {
    expect(compileSheetsQuery(parse({ ...base, operation: "read" }))).toEqual({
      command: "FETCH_MANY",
    });
  });

  it("compiles an append to INSERT_ONE with a JSON row object", () => {
    const compiled = compileSheetsQuery(
      parse({
        ...base,
        operation: "append",
        row: [
          { column: "name", value: { literal: "Ada" } },
          { column: "age", value: { literal: 30 } },
        ],
      }),
    );

    expect(compiled).toEqual({
      command: "INSERT_ONE",
      rowObjects: '{ "name": "Ada", "age": 30 }',
    });
  });

  it("emits a widget reference in an appended row as a bare checked binding", () => {
    const compiled = compileSheetsQuery(
      parse({
        ...base,
        operation: "append",
        row: [
          { column: "name", value: { widget: "NameInput", property: "text" } },
        ],
      }),
    );

    expect(compiled.rowObjects).toBe('{ "name": {{ NameInput.text }} }');
  });

  it("JSON-encodes a literal with quotes so it cannot break out of the row object", () => {
    const compiled = compileSheetsQuery(
      parse({
        ...base,
        operation: "append",
        row: [{ column: "name", value: { literal: '", "injected": "' } }],
      }),
    );

    const parsedRow = JSON.parse(compiled.rowObjects!) as Record<
      string,
      unknown
    >;

    expect(Object.keys(parsedRow)).toEqual(["name"]);
  });
});

describe("buildSheetsActionDto — exact Sheets formData shape", () => {
  it("emits a RANGE read with projection, pagination, and the header index", () => {
    const spec = parse({
      ...base,
      operation: "read",
      range: "A2:Z",
      columns: ["name", "email"],
      limit: 20,
    });
    const fd = formData(buildSheetsActionDto(spec, compileSheetsQuery(spec)));

    expect(fd.command).toEqual({
      data: "FETCH_MANY",
      viewType: "component",
      componentData: "FETCH_MANY",
    });
    expect(fd.entityType.data).toBe("ROWS");
    expect(fd.queryFormat.data).toBe("RANGE");
    expect(fd.range.data).toBe("A2:Z");
    expect(fd.projection.data).toEqual(["name", "email"]);
    expect(fd.tableHeaderIndex.data).toBe("1");
    expect(fd.smartSubstitution.data).toBe(true);
    expect(fd.pagination.data).toEqual({ limit: "20", offset: "0" });
    expect(fd.sheetUrl.data).toBe(base.sheetUrl);
    expect(fd.sheetName.data).toBe("Sheet1");
  });

  it("emits a plain ROWS read (all rows) when no range is given", () => {
    const spec = parse({ ...base, operation: "read", headerRow: 2 });
    const fd = formData(buildSheetsActionDto(spec, compileSheetsQuery(spec)));

    expect(fd.queryFormat.data).toBe("ROWS");
    expect(fd.where.data).toEqual({ condition: "AND" });
    expect(fd.projection.data).toEqual([]);
    expect(fd.range).toBeUndefined();
    expect(fd.tableHeaderIndex.data).toBe("2");
  });

  it("emits the INSERT_ONE append shape with the smart-substituted rowObjects field", () => {
    const spec = parse({
      ...base,
      operation: "append",
      row: [{ column: "name", value: { literal: "Ada" } }],
    });
    const dto = buildSheetsActionDto(spec, compileSheetsQuery(spec));
    const fd = formData(dto);

    expect(fd.command.data).toBe("INSERT_ONE");
    expect(fd.entityType.data).toBe("ROWS");
    expect(fd.rowObjects.data).toBe('{ "name": "Ada" }');
    expect(fd.smartSubstitution.data).toBe(true);
    // Datasource stays an embedded id; no OAuth token / credential ever appears.
    expect((dto as { datasource: unknown }).datasource).toEqual({ id: "ds1" });
    expect(JSON.stringify(dto)).not.toMatch(/password|token|oauth/i);
  });
});

describe("sheetsQuerySpecSchema — rejects unsafe references and values", () => {
  it("rejects a non-Google-Sheets or malformed sheetUrl", () => {
    for (const sheetUrl of [
      "https://evil.com/spreadsheets/d/1/edit",
      "http://docs.google.com/spreadsheets/d/1/edit",
      "https://docs.google.com/spreadsheets/d/1/{{evil}}",
      "javascript:alert(1)",
    ]) {
      expect(
        sheetsQuerySpecSchema.safeParse({
          ...base,
          sheetUrl,
          operation: "read",
        }).success,
      ).toBe(false);
    }
  });

  it("rejects a sheet name / column / range with unsafe characters", () => {
    expect(
      sheetsQuerySpecSchema.safeParse({
        ...base,
        sheetName: 'Sheet1"!A1',
        operation: "read",
      }).success,
    ).toBe(false);
    expect(
      sheetsQuerySpecSchema.safeParse({
        ...base,
        operation: "read",
        columns: ['a"]}}'],
      }).success,
    ).toBe(false);

    for (const range of ["A2:Z; DROP", "{{evil}}", "A2 Z", "'A1'"]) {
      expect(
        sheetsQuerySpecSchema.safeParse({ ...base, operation: "read", range })
          .success,
      ).toBe(false);
    }
  });

  it("rejects an append row value carrying template/binding syntax and unknown keys", () => {
    expect(
      sheetsQuerySpecSchema.safeParse({
        ...base,
        operation: "append",
        row: [{ column: "n", value: { literal: "{{evil}}" } }],
      }).success,
    ).toBe(false);
    expect(
      sheetsQuerySpecSchema.safeParse({
        ...base,
        operation: "append",
        row: [{ column: "n", value: { literal: "ok" } }],
        bogus: 1,
      }).success,
    ).toBe(false);
  });

  it("rejects range/columns on an append and row on a read (discriminated shape)", () => {
    expect(
      sheetsQuerySpecSchema.safeParse({
        ...base,
        operation: "append",
        row: [{ column: "n", value: { literal: "ok" } }],
        range: "A1:B2",
      }).success,
    ).toBe(false);
    expect(
      sheetsQuerySpecSchema.safeParse({
        ...base,
        operation: "read",
        row: [{ column: "n", value: { literal: "ok" } }],
      }).success,
    ).toBe(false);
  });
});
