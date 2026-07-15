import "@testing-library/jest-dom/extend-expect";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import McpTokenApi from "api/McpTokenApi";
import McpTokens from "./McpTokens";

jest.mock("api/McpTokenApi", () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    list: jest.fn(),
    rotate: jest.fn(),
    revoke: jest.fn(),
  },
}));

const successResponse = <T,>(data: T) => ({
  responseMeta: { success: true, status: 200 },
  data,
});

const renderComponent = () =>
  render(
    <ThemeProvider theme={lightTheme}>
      <McpTokens />
    </ThemeProvider>,
  );

describe("McpTokens", () => {
  beforeEach(() => {
    (McpTokenApi.list as jest.Mock).mockResolvedValue([
      successResponse({
        id: "token-1",
        createdAt: "2026-07-10T12:00:00.000Z",
        expiresAt: "2026-10-08T12:00:00.000Z",
      }),
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("lists metadata without displaying token plaintext", async () => {
    renderComponent();

    expect(await screen.findByText("token-1")).toBeInTheDocument();
    expect(screen.queryByText("secret-token")).not.toBeInTheDocument();
  });

  it("shows a labeled, read-only monospace token field after creation", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    (McpTokenApi.create as jest.Mock).mockResolvedValue(
      successResponse({
        id: "token-2",
        token: "secret-token",
        createdAt: "2026-07-10T12:00:00.000Z",
        expiresAt: "2026-10-08T12:00:00.000Z",
      }),
    );
    renderComponent();

    await screen.findByText("token-1");
    fireEvent.click(screen.getByRole("button", { name: "Create token" }));

    const tokenField = await screen.findByLabelText("MCP token");

    expect(tokenField).toHaveValue("secret-token");
    expect(tokenField).toHaveAttribute("readonly");
    expect(tokenField).toHaveStyle(
      "font-family: var(--ads-v2-font-family-code)",
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy token" }));

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "secret-token",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() =>
      expect(screen.queryByLabelText("MCP token")).not.toBeInTheDocument(),
    );
  });

  it("renders a copyable client-config snippet (server URL + token) after creation (M4-T3)", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    (McpTokenApi.create as jest.Mock).mockResolvedValue(
      successResponse({
        id: "token-3",
        token: "secret-token",
        createdAt: "2026-07-10T12:00:00.000Z",
        expiresAt: "2026-10-08T12:00:00.000Z",
      }),
    );
    renderComponent();

    await screen.findByText("token-1");
    fireEvent.click(screen.getByRole("button", { name: "Create token" }));
    await screen.findByLabelText("MCP token");

    // The Modal renders in a portal, so query the whole document, not the render container.
    const snippet = document.querySelector(".t--mcp-client-config");

    expect(snippet).toBeTruthy();
    // The snippet embeds the server URL (origin + /mcp) and the one-time token as a bearer credential.
    expect(snippet?.textContent).toContain("/mcp");
    expect(snippet?.textContent).toContain("Bearer secret-token");
    expect(snippet?.textContent).toContain("mcpServers");

    fireEvent.click(
      screen.getByRole("button", { name: "Copy client configuration" }),
    );
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalled(),
    );

    const copied = (navigator.clipboard.writeText as jest.Mock).mock
      .calls[0][0] as string;

    expect(copied).toContain("secret-token");
    expect(JSON.parse(copied).mcpServers.appsmith.url).toContain("/mcp");
  });

  it("shows the MCP server URL (origin + /mcp) with a working copy button", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    renderComponent();

    await screen.findByText("token-1");

    const urlField = screen.getByLabelText("MCP server URL");

    expect(urlField).toHaveValue(`${window.location.origin}/mcp`);
    expect(urlField).toHaveAttribute("readonly");

    fireEvent.click(screen.getByRole("button", { name: "Copy server URL" }));

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/mcp`,
      ),
    );
  });

  it("confirms a revoke request before calling the API", async () => {
    (McpTokenApi.revoke as jest.Mock).mockResolvedValue(successResponse(true));
    renderComponent();

    await screen.findByText("token-1");
    fireEvent.click(screen.getByRole("button", { name: "Revoke token-1" }));
    expect(McpTokenApi.revoke).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Revoke token" }));

    await waitFor(() =>
      expect(McpTokenApi.revoke).toHaveBeenCalledWith("token-1"),
    );
    expect(screen.queryByText("token-1")).not.toBeInTheDocument();
  });

  it("rotates a token only after confirmation and shows its replacement once", async () => {
    (McpTokenApi.rotate as jest.Mock).mockResolvedValue(
      successResponse({
        id: "token-1",
        token: "rotated-secret",
        createdAt: "2026-07-10T12:00:00.000Z",
        expiresAt: "2026-10-08T12:00:00.000Z",
      }),
    );
    renderComponent();

    await screen.findByText("token-1");
    fireEvent.click(screen.getByRole("button", { name: "Rotate token-1" }));
    expect(McpTokenApi.rotate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Rotate token" }));

    await waitFor(() =>
      expect(McpTokenApi.rotate).toHaveBeenCalledWith("token-1"),
    );
    expect(await screen.findByLabelText("MCP token")).toHaveValue(
      "rotated-secret",
    );
  });

  it("renders an accessible error when the token list fails", async () => {
    (McpTokenApi.list as jest.Mock).mockRejectedValue(
      new Error("Request failed"),
    );
    renderComponent();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Request failed",
    );
  });

  it("announces token loading status", () => {
    (McpTokenApi.list as jest.Mock).mockImplementation(
      async () => new Promise(() => undefined),
    );
    renderComponent();

    expect(screen.getByRole("status")).toHaveTextContent("Loading MCP tokens");
  });

  it("closes the revoke confirmation and shows a page error on failure", async () => {
    (McpTokenApi.revoke as jest.Mock).mockRejectedValue(
      new Error("Revocation failed"),
    );
    renderComponent();

    await screen.findByText("token-1");
    fireEvent.click(screen.getByRole("button", { name: "Revoke token-1" }));
    fireEvent.click(screen.getByRole("button", { name: "Revoke token" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Revocation failed",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("provides a clearly named cancel action for revoke confirmation", async () => {
    renderComponent();

    await screen.findByText("token-1");
    fireEvent.click(screen.getByRole("button", { name: "Revoke token-1" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(McpTokenApi.revoke).not.toHaveBeenCalled();
  });
});
