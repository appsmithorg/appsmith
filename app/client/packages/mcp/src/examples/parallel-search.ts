import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stderr, stdin, stdout } from "node:process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const PARALLEL_MCP_URL = "https://search.parallel.ai/mcp";
const DEFAULT_APPSMITH_MCP_URL = "http://127.0.0.1:8092/mcp";

type ToolClient = {
  callTool: (request: {
    name: string;
    arguments: Record<string, unknown>;
  }) => Promise<unknown>;
};

/** A source selected from Parallel's web-search response. */
export type SearchSource = {
  title: string;
  url: string;
  excerpt?: string;
};

export type ResearchAppSpec = {
  name: string;
  pages: Array<{
    name: string;
    widgets: Array<{ type: "text"; text: string }>;
  }>;
};

/** Narrows untrusted JSON values to non-array objects. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Returns a string field or the first string in a string array. */
function textValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.find((item): item is string => typeof item === "string");
  }
  return undefined;
}

/** Joins text content blocks from an MCP tool response. */
function resultText(result: unknown): string {
  if (!isRecord(result) || !Array.isArray(result.content)) return "";

  return result.content
    .map((item) =>
      isRecord(item) && item.type === "text" && typeof item.text === "string"
        ? item.text
        : "",
    )
    .filter((text) => text.length > 0)
    .join("\n")
    .trim();
}

/** Throws with the tool's returned error detail when an MCP call fails. */
function assertToolSuccess(result: unknown, toolName: string): void {
  if (isRecord(result) && result.isError === true) {
    throw new Error(
      `${toolName} failed: ${resultText(result) || "no error details returned"}`,
    );
  }
}

/** Normalizes a public HTTP(S) URL and rejects credentials or other schemes. */
function publicHttpUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  try {
    const url = new URL(value);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username !== "" ||
      url.password !== ""
    ) {
      return undefined;
    }
    return url.href;
  } catch {
    return undefined;
  }
}

/** Extracts up to five unique, credential-free HTTP(S) sources from search data. */
function searchSources(value: unknown): SearchSource[] {
  const sources: SearchSource[] = [];
  const seen = new Set<string>();

  /** Walks nested search data to find source records. */
  function visit(node: unknown): void {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!isRecord(node)) return;

    const url = publicHttpUrl(node.url);
    if (url && !seen.has(url)) {
      seen.add(url);
      sources.push({
        title: textValue(node.title) ?? url,
        url,
        excerpt:
          textValue(node.excerpt) ??
          textValue(node.snippet) ??
          textValue(node.description),
      });
    }

    Object.values(node).forEach(visit);
  }

  visit(value);
  return sources.slice(0, 5);
}

/** Parses JSON search output, retaining non-JSON text for URL extraction. */
function parseSearchResult(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/** Escapes text that could be interpreted as Appsmith template syntax. */
function appsmithSafeText(value: string): string {
  return value
    .replace(/\{\{/g, "{ {")
    .replace(/\}\}/g, "} }")
    .replace(/\$\{/g, "$ {")
    .replace(/`/g, "'")
    .replace(/[\u2028\u2029]/g, " ");
}

/** Removes C0 and C1 control characters before source text reaches the terminal. */
export function terminalSafeText(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f-\u009f]/g, "");
}

/** Builds a read-only research spec from the selected source and fetched text. */
export function createResearchAppSpec(
  topic: string,
  source: SearchSource,
  fetchedText: string,
): ResearchAppSpec {
  const evidence = [
    `Research question: ${appsmithSafeText(topic)}`,
    `Source: ${appsmithSafeText(source.title)}`,
    `URL: ${appsmithSafeText(source.url)}`,
    `Fetched page excerpt: ${appsmithSafeText(fetchedText).slice(0, 1200)}`,
  ].join("\n\n");

  return {
    name: "Parallel Web Research",
    pages: [
      {
        name: "Research",
        widgets: [{ type: "text", text: evidence }],
      },
    ],
  };
}

/** Searches, fetches a selected source, and validates its spec without creating an app. */
export async function runParallelResearchExample(
  topic: string,
  parallelClient: ToolClient,
  appsmithClient: ToolClient,
  chooseSource: (sources: SearchSource[]) => Promise<number>,
): Promise<{ source: SearchSource; fetchedText: string; validation: unknown }> {
  const cleanTopic = topic.trim();
  if (!cleanTopic) throw new Error("Provide a non-empty research topic.");

  const sessionId = randomUUID();
  const searchResult = await parallelClient.callTool({
    name: "web_search",
    arguments: {
      objective: `Find reliable source material for an Appsmith research brief about ${cleanTopic}.`,
      search_queries: [cleanTopic],
      session_id: sessionId,
    },
  });
  assertToolSuccess(searchResult, "Parallel web_search");

  const searchText = resultText(searchResult);
  const sources = searchSources(parseSearchResult(searchText));
  if (sources.length === 0) {
    throw new Error("Parallel web_search returned no HTTP(S) source URLs.");
  }

  const selectedIndex = await chooseSource(sources);
  if (
    !Number.isInteger(selectedIndex) ||
    selectedIndex < 0 ||
    selectedIndex >= sources.length
  ) {
    throw new Error(`Choose a source number from 1 to ${sources.length}.`);
  }
  const source = sources[selectedIndex];

  const fetchResult = await parallelClient.callTool({
    name: "web_fetch",
    arguments: {
      urls: [source.url],
      objective: `Find useful evidence for an Appsmith research brief about ${cleanTopic}.`,
      search_queries: [cleanTopic],
      session_id: sessionId,
    },
  });
  assertToolSuccess(fetchResult, "Parallel web_fetch");

  const fetchedText = resultText(fetchResult);
  if (!fetchedText)
    throw new Error("Parallel web_fetch returned no page text.");

  const validation = await appsmithClient.callTool({
    name: "validate_app_spec",
    arguments: {
      app: createResearchAppSpec(cleanTopic, source, fetchedText),
    },
  });
  assertToolSuccess(validation, "Appsmith validate_app_spec");

  return { source, fetchedText, validation };
}

/** Displays search results and returns the user's zero-based source selection. */
async function promptForSource(sources: SearchSource[]): Promise<number> {
  sources.forEach((source, index) => {
    stdout.write(`${index + 1}. ${terminalSafeText(source.title)}\n`);
    stdout.write(`   ${source.url}\n`);
    if (source.excerpt)
      stdout.write(`   ${terminalSafeText(source.excerpt)}\n`);
  });

  const terminal = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await terminal.question("Fetch which source? ");
    const selectedIndex = Number(answer) - 1;
    if (
      !Number.isInteger(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= sources.length
    ) {
      throw new Error(`Choose a source number from 1 to ${sources.length}.`);
    }
    return selectedIndex;
  } finally {
    terminal.close();
  }
}

/** Connects to both MCP servers and runs the interactive research example. */
async function main(): Promise<void> {
  const topic = process.argv.slice(2).join(" ").trim();
  if (!topic) {
    throw new Error(
      'Usage: yarn example:parallel-search "your research question"',
    );
  }

  const appsmithToken = process.env.APPSMITH_MCP_TOKEN;
  if (!appsmithToken) {
    throw new Error(
      "Set APPSMITH_MCP_TOKEN to your user-scoped Appsmith MCP token.",
    );
  }

  const appsmithUrl = new URL(
    process.env.APPSMITH_MCP_URL ?? DEFAULT_APPSMITH_MCP_URL,
  );
  const parallelClient = new Client(
    { name: "parallel-search-example", version: "1.0.0" },
    { capabilities: {} },
  );
  const appsmithClient = new Client(
    { name: "appsmith-research-example", version: "1.0.0" },
    { capabilities: {} },
  );

  try {
    await parallelClient.connect(
      new StreamableHTTPClientTransport(new URL(PARALLEL_MCP_URL)),
    );
    await appsmithClient.connect(
      new StreamableHTTPClientTransport(appsmithUrl, {
        requestInit: {
          headers: { Authorization: `Bearer ${appsmithToken}` },
        },
      }),
    );

    const result = await runParallelResearchExample(
      topic,
      parallelClient,
      appsmithClient,
      promptForSource,
    );

    stdout.write(`\nFetched ${result.source.title} (${result.source.url})\n`);
    stdout.write(
      `\nAppsmith dry-run result:\n${resultText(result.validation)}\n`,
    );
    stdout.write(
      "\nNo Appsmith app was created. Review the validated spec before choosing to build it.\n",
    );
  } finally {
    await Promise.all([parallelClient.close(), appsmithClient.close()]);
  }
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("/parallel-search.js")) {
  main().catch((error: unknown) => {
    stderr.write(
      error instanceof Error
        ? error.message
        : "Parallel research example failed.",
    );
    stderr.write("\n");
    process.exitCode = 1;
  });
}
