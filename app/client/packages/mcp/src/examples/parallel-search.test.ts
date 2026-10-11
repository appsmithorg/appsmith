import { jest } from "@jest/globals";
import {
  createResearchAppSpec,
  runParallelResearchExample,
  terminalSafeText,
  type SearchSource,
} from "./parallel-search.js";

type ToolCallRequest = {
  name: string;
  arguments: Record<string, unknown>;
};

const source: SearchSource = {
  title: "Primary source",
  url: "https://example.com/research",
  excerpt: "A useful search result",
};

function textResult(text: string) {
  return { content: [{ type: "text", text }] };
}

function mockClient(
  implementation: (request: ToolCallRequest) => Promise<unknown>,
) {
  return { callTool: jest.fn(implementation) };
}

describe("Parallel Search MCP example", () => {
  it("removes C0 and C1 controls from source text displayed in the terminal", () => {
    expect(terminalSafeText("Title\u0000\u001f\u007f\u009f text")).toBe(
      "Title text",
    );
  });

  it("fetches the chosen result and validates an Appsmith research spec", async () => {
    const parallelClient = mockClient(async ({ name }) => {
      if (name === "web_search") {
        return textResult(
          JSON.stringify({
            results: [source, { ...source, url: "javascript:alert(1)" }],
          }),
        );
      }
      return textResult("Evidence from the selected page");
    });
    const appsmithClient = mockClient(async () => textResult('{"valid":true}'));

    const result = await runParallelResearchExample(
      "MCP research",
      parallelClient,
      appsmithClient,
      async (sources) => {
        expect(sources).toEqual([source]);
        return 0;
      },
    );

    expect(parallelClient.callTool).toHaveBeenNthCalledWith(1, {
      name: "web_search",
      arguments: expect.objectContaining({
        objective: expect.stringContaining("MCP research"),
        search_queries: ["MCP research"],
        session_id: expect.any(String),
      }),
    });
    expect(parallelClient.callTool).toHaveBeenNthCalledWith(2, {
      name: "web_fetch",
      arguments: expect.objectContaining({
        urls: [source.url],
        search_queries: ["MCP research"],
        session_id: expect.any(String),
      }),
    });
    expect(appsmithClient.callTool).toHaveBeenCalledWith({
      name: "validate_app_spec",
      arguments: {
        app: expect.objectContaining({
          name: "Parallel Web Research",
          pages: [
            expect.objectContaining({
              name: "Research",
              widgets: [
                expect.objectContaining({
                  type: "text",
                  text: expect.stringContaining(
                    "Evidence from the selected page",
                  ),
                }),
              ],
            }),
          ],
        }),
      },
    });
    expect(result.source).toEqual(source);
    expect(result.fetchedText).toBe("Evidence from the selected page");
  });

  it("keeps fetched text inside the Appsmith closed-text grammar", () => {
    const spec = createResearchAppSpec(
      "Research ${topic}",
      source,
      "Text {{ binding }} with ${code}, `template` and \u2028 separators",
    );
    const text = spec.pages[0].widgets[0].text;

    expect(text).not.toMatch(/\{\{|\}\}|\$\{|`|\u2028|\u2029/);
    expect(text).toContain("{ { binding } }");
  });

  it("refuses an invalid source selection before fetching or calling Appsmith", async () => {
    const parallelClient = mockClient(async () =>
      textResult(JSON.stringify({ results: [source] })),
    );
    const appsmithClient = mockClient(async () => undefined);

    await expect(
      runParallelResearchExample(
        "MCP research",
        parallelClient,
        appsmithClient,
        async () => 1,
      ),
    ).rejects.toThrow("Choose a source number from 1 to 1.");
    expect(parallelClient.callTool).toHaveBeenCalledTimes(1);
    expect(appsmithClient.callTool).not.toHaveBeenCalled();
  });

  it("surfaces Parallel tool errors rather than presenting a success-shaped result", async () => {
    const parallelClient = mockClient(async () => ({
      isError: true,
      content: [{ type: "text", text: "unavailable" }],
    }));

    await expect(
      runParallelResearchExample(
        "MCP research",
        parallelClient,
        mockClient(async () => undefined),
        async () => 0,
      ),
    ).rejects.toThrow("Parallel web_search failed: unavailable");
  });
});
