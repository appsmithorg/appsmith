// Live authenticated test harness against the local MCP server (http://127.0.0.1:8092/mcp).
// Run from packages/mcp:  MCP_TOKEN=mcp_xxx node live-harness.mjs
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const TOKEN = process.env.MCP_TOKEN;
if (!TOKEN) {
  console.error("Set MCP_TOKEN=mcp_...");
  process.exit(2);
}

const results = [];
const rec = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`,
  );
};

const transport = new StreamableHTTPClientTransport(
  new URL("http://127.0.0.1:8092/mcp"),
  { requestInit: { headers: { Authorization: `Bearer ${TOKEN}` } } },
);
const client = new Client(
  { name: "live-harness", version: "1.0.0" },
  { capabilities: {} },
);
await client.connect(transport);

const textOf = (r) => r?.content?.[0]?.text ?? "";
// Call a tool and return its parsed JSON result (or {} if not JSON).
async function J(name, args) {
  const r = await client.callTool({ name, arguments: args });
  try {
    return JSON.parse(textOf(r));
  } catch {
    return { _raw: textOf(r) };
  }
}
const has = (obj, re) => re.test(JSON.stringify(obj));

try {
  // 1. tool discovery
  const tools = (await client.listTools()).tools.map((t) => t.name);
  const want = [
    "get_guide",
    "read_git_status",
    "create_branch",
    "prepare_commit",
    "confirm_commit",
    "build_application",
    "patch_widgets",
    "wire_event",
    "inspect_page",
    "get_capabilities",
  ];
  const missing = want.filter((w) => !tools.includes(w));
  rec(
    `tool discovery (${tools.length} tools registered)`,
    missing.length === 0,
    missing.length ? "MISSING: " + missing : "all present",
  );

  // 2. capabilities — build stamp + patchSpec.tableData vocabulary
  const caps = await J("get_capabilities", {});
  rec(
    "capabilities.build.version present",
    !!caps.build?.version,
    JSON.stringify(caps.build || {}),
  );
  rec(
    "capabilities.patchSpec.tableData documents query/store",
    /query|store/.test(caps.patchSpec?.updateProps?.tableData || ""),
    (caps.patchSpec?.updateProps?.tableData || "").slice(0, 55),
  );

  // 3. get_guide — tools-only-client feature
  const guide = await J("get_guide", { slug: "zip-lookup" });
  rec(
    "get_guide zip-lookup renders markdown",
    (guide.markdown || guide._raw || "").includes("appendToStore"),
  );
  const badGuide = await J("get_guide", { slug: "no-such-guide" });
  rec(
    "get_guide unknown slug -> error + available list",
    Array.isArray(badGuide.available),
    (badGuide.error || "").slice(0, 50),
  );

  // 4. workspace discovery
  const ws = await J("list_workspaces", {});
  const workspaceId = ws.workspaces?.[0]?.id;
  rec(
    "list_workspaces returns >=1",
    !!workspaceId,
    (ws.workspaces || [])
      .map((w) => w.name)
      .join(", ")
      .slice(0, 60),
  );

  // 5a. CONTROL: a clean, well-formed spec must VALIDATE (proves the arg shape is right, so an injection
  //     rejection below is about the binding, not the envelope).
  const clean = await J("validate_app_spec", {
    app: {
      name: "clean",
      pages: [{ name: "P", widgets: [{ type: "text", text: "hello world" }] }],
    },
  });
  const cleanOk = !/-32602|error|invalid|reject/i.test(JSON.stringify(clean));
  rec(
    "CONTROL: clean spec validates",
    cleanOk,
    JSON.stringify(clean).slice(0, 70),
  );

  // 5b. ADVERSARIAL closed-vocabulary: same well-formed envelope, but a raw {{ }} / backtick in a FIELD must be
  //     rejected by the compiler (a structured validation rejection, NOT the -32602 shape error).
  const inj1 = await J("validate_app_spec", {
    app: {
      name: "i1",
      pages: [
        { name: "P", widgets: [{ type: "text", text: "{{ alert(1) }}" }] },
      ],
    },
  });
  rec(
    "REJECT raw {{ }} in text field",
    !cleanOk
      ? false
      : has(inj1, /binding|template|reject|invalid|must not|not allowed/i) &&
          !has(inj1, /-32602/),
    JSON.stringify(inj1).slice(0, 90),
  );
  const inj2 = await J("validate_app_spec", {
    app: {
      name: "i2",
      pages: [
        {
          name: "P",
          widgets: [{ type: "button", text: "x", onClick: "{{ evil() }}" }],
        },
      ],
    },
  });
  rec(
    "REJECT raw binding in onClick",
    has(inj2, /binding|template|reject|invalid|expect|must/i) &&
      !has(inj2, /-32602/),
    JSON.stringify(inj2).slice(0, 90),
  );
  const inj3 = await J("validate_app_spec", {
    app: {
      name: "i3",
      pages: [
        { name: "P", widgets: [{ type: "text", text: "safe", name: "a`b" }] },
      ],
    },
  });
  rec(
    "REJECT backtick in a widget name",
    has(inj3, /name|reject|invalid|expect|must|match|template/i) &&
      !has(inj3, /-32602/),
    JSON.stringify(inj3).slice(0, 90),
  );

  // 6. build the ZIP-lookup skeleton end-to-end
  if (workspaceId) {
    const built = await J("build_application", {
      workspaceId,
      app: {
        name: `LiveTest ${Date.now()}`,
        pages: [
          {
            name: "Lookup",
            widgets: [
              {
                type: "input",
                name: "ZipInput",
                label: "ZIP",
                validation: { format: "zipcode" },
              },
              { type: "button", name: "LookupBtn", text: "Look up" },
              { type: "button", name: "ClearBtn", text: "Clear" },
              {
                type: "table",
                name: "ZipResults",
                data: [{ zip: "", city: "" }],
              },
            ],
          },
        ],
      },
    });
    const appId = built.applicationId || built.application?.id;
    rec(
      "build_application creates app",
      !!appId,
      "warnings=" + JSON.stringify(built.warnings || null),
    );
    rec(
      "build_application returns URL / auto-publish",
      !!(built.editorUrl || built.viewerUrl || built.warnings),
      (built.editorUrl || "").slice(0, 70),
    );

    const pageId = built.pages?.[0]?.id;
    const layoutId = built.pages?.[0]?.layoutId;
    if (appId && pageId && layoutId) {
      const page = await J("read_semantic_page", {
        applicationId: appId,
        pageId,
        layoutId,
      });
      const revision = page.revision;
      rec("read_semantic_page returns revision", !!revision);

      if (revision) {
        // overlap repair: move ClearBtn onto another widget's cells
        const moved = await J("patch_widgets", {
          applicationId: appId,
          pageId,
          layoutId,
          revision,
          patch: {
            operations: [
              {
                kind: "move",
                name: "ClearBtn",
                position: { topRow: 0, leftColumn: 0 },
              },
            ],
          },
        });
        rec(
          "patch_widgets move handles overlap (no crash)",
          !!(moved.changes || moved.code),
          moved.code || "applied",
        );
      }

      const gs = await J("read_git_status", { applicationId: appId });
      // The projection nests state under `git` (git.connected / git.branchName), never at the top level.
      rec(
        "read_git_status returns a boolean git.connected",
        typeof gs.git?.connected === "boolean",
        "git.connected=" + gs.git?.connected,
      );
      rec(
        "read_git_status leaks no keys/auth",
        !/privateKey|gitAuth|ssh-rsa|BEGIN .* PRIVATE/.test(JSON.stringify(gs)),
      );
    }
  }

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n==== ${passed}/${results.length} passed ====`);
} finally {
  await client.close();
}
