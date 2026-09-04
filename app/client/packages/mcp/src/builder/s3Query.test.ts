import {
  buildS3ActionDto,
  compileS3Query,
  s3QuerySpecSchema,
} from "./s3Query.js";

function parse(query: unknown) {
  return s3QuerySpecSchema.safeParse(query);
}

const base = {
  name: "S3Q",
  applicationId: "app1",
  pageId: "p1",
  datasourceId: "ds1",
};

describe("create_s3_query builder", () => {
  it("compiles a LIST with a prefix (unsigned URLs, smartSubstitution on)", () => {
    const parsed = parse({
      ...base,
      operation: "list",
      bucket: "my-bucket",
      prefix: "invoices/2026",
    });

    expect(parsed.success).toBe(true);
    const compiled = compileS3Query(parsed.data!);

    expect(compiled.command).toBe("LIST");
    expect(compiled.formData.command).toEqual({ data: "LIST" });
    expect(compiled.formData.bucket).toEqual({ data: "my-bucket" });
    expect(compiled.formData.smartSubstitution).toEqual({ data: true });
    expect(compiled.formData.list).toEqual({
      prefix: { data: "invoices/2026" },
      signedUrl: { data: "NO" },
      unSignedUrl: { data: "YES" },
    });
    expect(compiled.bindingPaths).toEqual([]);
  });

  it("compiles a READ with a literal path", () => {
    const parsed = parse({
      ...base,
      operation: "read",
      bucket: "b",
      path: { literal: "docs/report.pdf" },
    });

    expect(parsed.success).toBe(true);
    const compiled = compileS3Query(parsed.data!);

    expect(compiled.command).toBe("READ_FILE");
    expect(compiled.formData.path).toEqual({ data: "docs/report.pdf" });
  });

  it("compiles an UPLOAD with a widget-bound path and body, registering both bindings", () => {
    const parsed = parse({
      ...base,
      operation: "upload",
      bucket: "b",
      path: { widget: "FileName", property: "text" },
      body: { widget: "Editor", property: "text" },
    });

    expect(parsed.success).toBe(true);
    const compiled = compileS3Query(parsed.data!);

    expect(compiled.command).toBe("UPLOAD_FILE_FROM_BODY");
    expect(compiled.formData.path).toEqual({ data: "{{ FileName.text }}" });
    expect(compiled.formData.body).toEqual({ data: "{{ Editor.text }}" });
    // Copy before sorting — sort() mutates, and buildS3ActionDto below reads compiled.bindingPaths in emit order.
    expect([...compiled.bindingPaths].sort()).toEqual([
      "formData.body.data",
      "formData.path.data",
    ]);

    const dto = buildS3ActionDto(parsed.data!, compiled) as {
      actionConfiguration: { dynamicBindingPathList?: { key: string }[] };
    };

    expect(dto.actionConfiguration.dynamicBindingPathList).toEqual([
      { key: "formData.path.data" },
      { key: "formData.body.data" },
    ]);
  });

  it("compiles a DELETE and omits the binding path for a literal key", () => {
    const parsed = parse({
      ...base,
      operation: "delete",
      bucket: "b",
      path: { literal: "tmp/old.txt" },
    });

    expect(parsed.success).toBe(true);
    const compiled = compileS3Query(parsed.data!);

    expect(compiled.command).toBe("DELETE_FILE");
    const dto = buildS3ActionDto(parsed.data!, compiled) as {
      actionConfiguration: { dynamicBindingPathList?: unknown };
    };

    expect("dynamicBindingPathList" in dto.actionConfiguration).toBe(false);
  });

  it("rejects unsafe/mismatched specs", () => {
    const bad: unknown[] = [
      // bucket charset (uppercase/space not allowed in DNS bucket names).
      {
        ...base,
        operation: "read",
        bucket: "Bad Bucket",
        path: { literal: "a" },
      },
      // key charset — a quote would break out of the formData string literal.
      {
        ...base,
        operation: "read",
        bucket: "b",
        path: { literal: 'a"];x' },
      },
      // binding syntax in an upload body literal.
      {
        ...base,
        operation: "upload",
        bucket: "b",
        path: { literal: "k" },
        body: { literal: "{{evil}}" },
      },
      // read requires a path.
      { ...base, operation: "read", bucket: "b" },
      // list uses prefix, not path.
      {
        ...base,
        operation: "list",
        bucket: "b",
        path: { literal: "k" },
      },
      // upload requires a body.
      { ...base, operation: "upload", bucket: "b", path: { literal: "k" } },
      // body only valid on upload.
      {
        ...base,
        operation: "read",
        bucket: "b",
        path: { literal: "k" },
        body: { literal: "x" },
      },
      // unknown operation.
      { ...base, operation: "move", bucket: "b", path: { literal: "k" } },
    ];

    for (const spec of bad) {
      expect(parse(spec).success).toBe(false);
    }
  });
});
