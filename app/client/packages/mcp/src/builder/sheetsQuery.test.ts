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

describe("compileSheetsQuery — structured Sheets read/append/update", () => {
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

  it("compiles an update to UPDATE_ONE with a leading rowIndex key", () => {
    const compiled = compileSheetsQuery(
      parse({
        ...base,
        operation: "update",
        rowIndex: { literal: 4 },
        row: [
          { column: "name", value: { literal: "Ada" } },
          { column: "status", value: { literal: "done" } },
        ],
      }),
    );

    expect(compiled).toEqual({
      command: "UPDATE_ONE",
      rowObjects: '{ "rowIndex": 4, "name": "Ada", "status": "done" }',
    });
  });

  it("emits a widget-bound rowIndex (e.g. the selected table row) as a checked binding", () => {
    const compiled = compileSheetsQuery(
      parse({
        ...base,
        operation: "update",
        rowIndex: { widget: "Table1", property: "selectedRow.rowIndex" },
        row: [
          {
            column: "status",
            value: { widget: "StatusInput", property: "text" },
          },
        ],
      }),
    );

    expect(compiled.rowObjects).toBe(
      '{ "rowIndex": {{ Table1.selectedRow.rowIndex }}, "status": {{ StatusInput.text }} }',
    );
  });

  it("emits a literal rowIndex of 0 (the first data row is a valid target)", () => {
    const compiled = compileSheetsQuery(
      parse({
        ...base,
        operation: "update",
        rowIndex: { literal: 0 },
        row: [{ column: "status", value: { literal: "done" } }],
      }),
    );

    expect(compiled.rowObjects).toBe('{ "rowIndex": 0, "status": "done" }');
  });

  it("rejects a compiled update whose row carries the reserved rowIndex column", () => {
    expect(() =>
      compileSheetsQuery(
        parse({
          ...base,
          operation: "update",
          rowIndex: { literal: 0 },
          row: [{ column: "rowIndex", value: { literal: 9 } }],
        }),
      ),
    ).toThrow(/reserved/);
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

describe("compileSheetsQuery — filtered read (server-side where clause)", () => {
  it("compiles a static filter to an AND where clause of literal conditions", () => {
    const compiled = compileSheetsQuery(
      parse({
        ...base,
        operation: "read",
        filter: [
          { column: "Status", op: "eq", value: { literal: "Completed" } },
        ],
      }),
    );

    expect(compiled.command).toBe("FETCH_MANY");
    expect(compiled.whereHasBinding).toBe(false);
    expect(JSON.parse(compiled.where!)).toEqual({
      condition: "AND",
      children: [{ condition: "EQ", key: "Status", value: "Completed" }],
    });
  });

  it("maps each operator to the plugin's ConditionalOperator", () => {
    const compiled = compileSheetsQuery(
      parse({
        ...base,
        operation: "read",
        filter: [
          { column: "Priority", op: "gte", value: { literal: 3 } },
          { column: "Title", op: "contains", value: { literal: "urgent" } },
        ],
      }),
    );

    expect(JSON.parse(compiled.where!).children).toEqual([
      { condition: "GTE", key: "Priority", value: "3" },
      { condition: "CONTAINS", key: "Title", value: "urgent" },
    ]);
  });

  it("emits a widget-bound filter value as a checked binding and flags it", () => {
    const compiled = compileSheetsQuery(
      parse({
        ...base,
        operation: "read",
        filter: [
          {
            column: "Status",
            op: "eq",
            value: { widget: "StatusSelect", property: "selectedOptionValue" },
          },
        ],
      }),
    );

    expect(compiled.whereHasBinding).toBe(true);
    expect(JSON.parse(compiled.where!).children[0].value).toBe(
      "{{ StatusSelect.selectedOptionValue }}",
    );
  });

  it("JSON-encodes a filter literal with a quote so it cannot break the where string", () => {
    const compiled = compileSheetsQuery(
      parse({
        ...base,
        operation: "read",
        filter: [
          { column: "Note", op: "eq", value: { literal: '"}] injected' } },
        ],
      }),
    );

    // Parses cleanly with exactly one condition — the quote is escaped, not a breakout.
    expect(JSON.parse(compiled.where!).children).toHaveLength(1);
  });

  it("rejects a filtered read that also specifies a range (where is ignored in range mode)", () => {
    expect(() =>
      compileSheetsQuery(
        parse({
          ...base,
          operation: "read",
          range: "A2:Z",
          filter: [{ column: "Status", op: "eq", value: { literal: "Done" } }],
        }),
      ),
    ).toThrow(/range/);
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

  it("emits a filtered read as a JSON where leaf with no binding path when values are static", () => {
    const spec = parse({
      ...base,
      operation: "read",
      filter: [{ column: "Status", op: "eq", value: { literal: "Completed" } }],
    });
    const dto = buildSheetsActionDto(spec, compileSheetsQuery(spec));
    const fd = formData(dto);

    expect(fd.queryFormat.data).toBe("ROWS");
    // JSON view so the plugin parses the string back into the where Map.
    expect((fd.where as unknown as { viewType: string }).viewType).toBe("json");
    expect(JSON.parse(fd.where.data as string)).toEqual({
      condition: "AND",
      children: [{ condition: "EQ", key: "Status", value: "Completed" }],
    });
    // Static values need no client eval, so no dynamicBindingPathList.
    expect(
      (dto as { actionConfiguration: { dynamicBindingPathList?: unknown } })
        .actionConfiguration.dynamicBindingPathList,
    ).toBeUndefined();
    expect((dto as { executeOnLoad: boolean }).executeOnLoad).toBe(true);
  });

  it("registers formData.where.data for eval when a filter value is widget-bound", () => {
    const spec = parse({
      ...base,
      operation: "read",
      filter: [
        {
          column: "Status",
          op: "eq",
          value: { widget: "StatusSelect", property: "selectedOptionValue" },
        },
      ],
    });
    const dto = buildSheetsActionDto(spec, compileSheetsQuery(spec)) as {
      actionConfiguration: { dynamicBindingPathList: { key: string }[] };
    };

    expect(dto.actionConfiguration.dynamicBindingPathList).toEqual([
      { key: "formData.where.data" },
    ]);
  });

  it("runs a read on page load but not an append (executeOnLoad)", () => {
    const read = buildSheetsActionDto(
      parse({ ...base, operation: "read" }),
      compileSheetsQuery(parse({ ...base, operation: "read" })),
    ) as { executeOnLoad: boolean };
    const appendSpec = parse({
      ...base,
      operation: "append",
      row: [{ column: "name", value: { literal: "Ada" } }],
    });
    const append = buildSheetsActionDto(
      appendSpec,
      compileSheetsQuery(appendSpec),
    ) as { executeOnLoad: boolean };

    expect(read.executeOnLoad).toBe(true);
    expect(append.executeOnLoad).toBe(false);
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

  it("emits the UPDATE_ONE shape (rowObjects with rowIndex, manual, no on-load run)", () => {
    const spec = parse({
      ...base,
      operation: "update",
      rowIndex: { literal: 2 },
      row: [{ column: "status", value: { literal: "done" } }],
    });
    const dto = buildSheetsActionDto(spec, compileSheetsQuery(spec));
    const fd = formData(dto);

    expect(fd.command.data).toBe("UPDATE_ONE");
    expect(fd.entityType.data).toBe("ROWS");
    expect(fd.rowObjects.data).toBe('{ "rowIndex": 2, "status": "done" }');
    expect(fd.smartSubstitution.data).toBe(true);
    expect((dto as { executeOnLoad: boolean }).executeOnLoad).toBe(false);
    // A mutation stays an embedded id; no OAuth token / credential ever appears.
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

  it("rejects a filter with an unknown operator, an empty filter, or a template-carrying value", () => {
    expect(
      sheetsQuerySpecSchema.safeParse({
        ...base,
        operation: "read",
        filter: [{ column: "Status", op: "like", value: { literal: "x" } }],
      }).success,
    ).toBe(false);
    expect(
      sheetsQuerySpecSchema.safeParse({
        ...base,
        operation: "read",
        filter: [],
      }).success,
    ).toBe(false);
    expect(
      sheetsQuerySpecSchema.safeParse({
        ...base,
        operation: "read",
        filter: [
          { column: "Status", op: "eq", value: { literal: "{{evil}}" } },
        ],
      }).success,
    ).toBe(false);
    // A filter column with unsafe characters is rejected by the same charset gate as a projection column.
    expect(
      sheetsQuerySpecSchema.safeParse({
        ...base,
        operation: "read",
        filter: [{ column: 'S"}]', op: "eq", value: { literal: "x" } }],
      }).success,
    ).toBe(false);
  });

  it("rejects an update missing rowIndex, or with a non-integer / negative rowIndex", () => {
    expect(
      sheetsQuerySpecSchema.safeParse({
        ...base,
        operation: "update",
        row: [{ column: "n", value: { literal: "ok" } }],
      }).success,
    ).toBe(false);

    for (const rowIndex of [
      { literal: -1 },
      { literal: 1.5 },
      { literal: "3" },
    ]) {
      expect(
        sheetsQuerySpecSchema.safeParse({
          ...base,
          operation: "update",
          rowIndex,
          row: [{ column: "n", value: { literal: "ok" } }],
        }).success,
      ).toBe(false);
    }
  });

  it("rejects an update rowIndex binding carrying template syntax", () => {
    expect(
      sheetsQuerySpecSchema.safeParse({
        ...base,
        operation: "update",
        rowIndex: { widget: "T", property: "selectedRow.{{evil}}" },
        row: [{ column: "n", value: { literal: "ok" } }],
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
