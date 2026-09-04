import "@testing-library/jest-dom/extend-expect";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import McpTokenApi from "api/McpTokenApi";
import McpKeysPage from "./McpKeysPage";
import { useDispatch, useSelector } from "react-redux";

jest.mock("api/McpTokenApi", () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    list: jest.fn(),
    rotate: jest.fn(),
    revoke: jest.fn(),
  },
}));

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock("ee/actions/organizationActions", () => ({
  getCurrentOrganization: () => ({ type: "FETCH_CURRENT_ORGANIZATION_CONFIG" }),
}));

const mockDispatch = jest.fn();

const successResponse = <T,>(data: T) => ({
  responseMeta: { success: true, status: 200 },
  data,
});

const renderComponent = () =>
  render(
    <ThemeProvider theme={lightTheme}>
      <McpKeysPage />
    </ThemeProvider>,
  );

const openCreateModal = async () => {
  await screen.findByText("Claude Desktop");
  fireEvent.click(screen.getByRole("button", { name: "Create Key" }));
  expect(await screen.findByLabelText("Name")).toBeInTheDocument();
};

const submitCreateModal = () => {
  fireEvent.click(screen.getByRole("button", { name: "Create" }));
};

const openRowMenu = async (name = "Claude Desktop") => {
  await screen.findByText(name);
  fireEvent.click(
    screen.getByRole("button", { name: `More actions for ${name}` }),
  );
  expect(
    await screen.findByRole("menuitem", { name: "Rotate" }),
  ).toBeInTheDocument();
};

describe("McpKeysPage", () => {
  beforeEach(() => {
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector) =>
      selector({
        organization: {
          organizationConfiguration: {
            mcpConfig: { enabled: true },
          },
        },
      }),
    );
    mockDispatch.mockClear();
    // One envelope whose data is the whole list, matching the server's Mono<ResponseDTO<List<T>>>.
    (McpTokenApi.list as jest.Mock).mockResolvedValue(
      successResponse([
        {
          id: "token-1",
          name: "Claude Desktop",
          createdAt: "2026-07-10T12:00:00.000Z",
          expiresAt: "2026-10-08T12:00:00.000Z",
          status: "ACTIVE",
        },
      ]),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("fetches tenant config and skips listing tokens when MCP is not enabled", () => {
    (useSelector as jest.Mock).mockImplementation((selector) =>
      selector({
        organization: {
          organizationConfiguration: {
            mcpConfig: { enabled: false },
          },
        },
      }),
    );
    renderComponent();

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "FETCH_CURRENT_ORGANIZATION_CONFIG",
    });
    expect(McpTokenApi.list).not.toHaveBeenCalled();
    expect(screen.queryByText("token-1")).not.toBeInTheDocument();
  });

  it("lists metadata without displaying token plaintext", async () => {
    renderComponent();

    expect(await screen.findByText("Claude Desktop")).toBeInTheDocument();
    expect(screen.getByText("mcp_token-1....")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Key name" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Status" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Created" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Expires" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("secret-token")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Revoke Claude Desktop" }),
    ).not.toBeInTheDocument();
  });

  it("shows the header title, description, and Create Key without an always-on name field", async () => {
    renderComponent();

    expect(await screen.findByTestId("t--mcp-keys-header")).toHaveTextContent(
      "MCP keys",
    );
    expect(
      screen.getByText(
        "A key authenticates an MCP client as you. It is shown only once after you create or rotate it.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "How to connect" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Key" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("MCP server URL")).not.toBeInTheDocument();
    expect(
      screen
        .getByRole("button", { name: "How to connect" })
        .compareDocumentPosition(
          screen.getByRole("button", { name: "Create Key" }),
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("opens a create modal and sends name plus keySpanDays", async () => {
    (McpTokenApi.create as jest.Mock).mockResolvedValue(
      successResponse({
        id: "token-2",
        token: "secret-token",
        createdAt: "2026-07-10T12:00:00.000Z",
        expiresAt: "2026-10-08T12:00:00.000Z",
        status: "ACTIVE",
      }),
    );
    renderComponent();

    await openCreateModal();
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Claude Desktop" },
    });
    expect(screen.getByText("Key validity in days")).toBeInTheDocument();
    submitCreateModal();

    await waitFor(() =>
      expect(McpTokenApi.create).toHaveBeenCalledWith("Claude Desktop", 30),
    );
    expect(await screen.findByLabelText("MCP token")).toHaveValue(
      "secret-token",
    );
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });

  it("does not create a key when the create modal is cancelled", async () => {
    renderComponent();

    await openCreateModal();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(screen.queryByLabelText("Name")).not.toBeInTheDocument(),
    );
    expect(McpTokenApi.create).not.toHaveBeenCalled();
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

    await openCreateModal();
    submitCreateModal();

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

    await openCreateModal();
    submitCreateModal();
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

    await screen.findByText("Claude Desktop");
    fireEvent.click(screen.getByRole("button", { name: "How to connect" }));

    const urlField = await screen.findByLabelText("MCP server URL");

    expect(urlField).toHaveValue(`${window.location.origin}/mcp`);
    expect(urlField).toHaveAttribute("readonly");
    expect(
      document.querySelector(".t--mcp-client-config")?.textContent,
    ).toContain("<YOUR_MCP_KEY>");

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

    await screen.findByText("Claude Desktop");
    await openRowMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Revoke" }));
    expect(McpTokenApi.revoke).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Revoke token" }));

    await waitFor(() =>
      expect(McpTokenApi.revoke).toHaveBeenCalledWith("token-1"),
    );
    expect(screen.queryByText("Claude Desktop")).not.toBeInTheDocument();
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

    await screen.findByText("Claude Desktop");
    await openRowMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Rotate" }));
    expect(McpTokenApi.rotate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Rotate token" }));

    await waitFor(() =>
      expect(McpTokenApi.rotate).toHaveBeenCalledWith("token-1"),
    );
    expect(await screen.findByLabelText("MCP token")).toHaveValue(
      "rotated-secret",
    );
  });

  it("keeps the one-time token on screen when Escape is pressed", async () => {
    // The secret is unrecoverable once dismissed, so an accidental Escape must NOT destroy it. Recovery would
    // otherwise mean rotating — a second destructive action — and on plain-HTTP instances navigator.clipboard is
    // undefined, so the user may still be copying by hand when they hit a stray key.
    (McpTokenApi.create as jest.Mock).mockResolvedValue(
      successResponse({
        id: "token-2",
        token: "secret-token",
        createdAt: "2026-07-10T12:00:00.000Z",
        expiresAt: "2026-10-08T12:00:00.000Z",
      }),
    );
    renderComponent();

    await openCreateModal();
    submitCreateModal();

    const tokenField = await screen.findByLabelText("MCP token");

    expect(tokenField).toHaveValue("secret-token");

    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
      code: "Escape",
    });

    // Still there.
    expect(screen.getByLabelText("MCP token")).toHaveValue("secret-token");

    // Only the explicit acknowledgement dismisses it.
    fireEvent.click(screen.getByRole("button", { name: "I've copied it" }));

    await waitFor(() =>
      expect(screen.queryByLabelText("MCP token")).not.toBeInTheDocument(),
    );
  });

  it("does not claim the user has no tokens when the list failed to load", async () => {
    // On a failed load `tokens` is empty for a reason that is NOT "you have none". Rendering the empty-state copy
    // alongside the error reads as "your credentials were deleted".
    (McpTokenApi.list as jest.Mock).mockRejectedValue(
      new Error("Request failed"),
    );
    renderComponent();

    await screen.findByRole("alert");

    expect(
      screen.queryByText("No MCP tokens have been created."),
    ).not.toBeInTheDocument();
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

    await openRowMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Revoke" }));
    fireEvent.click(screen.getByRole("button", { name: "Revoke token" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Revocation failed",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("provides a clearly named cancel action for revoke confirmation", async () => {
    renderComponent();

    await openRowMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Revoke" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(McpTokenApi.revoke).not.toHaveBeenCalled();
  });

  it("shows Expired status for keys that have passed their expiry", async () => {
    (McpTokenApi.list as jest.Mock).mockResolvedValue(
      successResponse([
        {
          id: "token-1",
          name: "Claude Desktop",
          createdAt: "2026-01-10T12:00:00.000Z",
          expiresAt: "2026-01-11T12:00:00.000Z",
          status: "EXPIRED",
        },
      ]),
    );
    renderComponent();

    expect(await screen.findByText("Expired")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  it("filters the table by key name search", async () => {
    (McpTokenApi.list as jest.Mock).mockResolvedValue(
      successResponse([
        {
          id: "token-1",
          name: "Claude Desktop",
          createdAt: "2026-07-10T12:00:00.000Z",
          expiresAt: "2026-10-08T12:00:00.000Z",
          status: "ACTIVE",
        },
        {
          id: "token-2",
          name: "CI pipeline",
          createdAt: "2026-07-10T12:00:00.000Z",
          expiresAt: "2026-10-08T12:00:00.000Z",
          status: "ACTIVE",
        },
      ]),
    );
    renderComponent();

    expect(await screen.findByText("Claude Desktop")).toBeInTheDocument();
    expect(screen.getByText("CI pipeline")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search keys"), {
      target: { value: "pipeline" },
    });

    expect(screen.getByText("CI pipeline")).toBeInTheDocument();
    expect(screen.queryByText("Claude Desktop")).not.toBeInTheDocument();
  });

  it("filters the table by status", async () => {
    (McpTokenApi.list as jest.Mock).mockResolvedValue(
      successResponse([
        {
          id: "token-1",
          name: "Claude Desktop",
          createdAt: "2026-07-10T12:00:00.000Z",
          expiresAt: "2026-10-08T12:00:00.000Z",
          status: "ACTIVE",
        },
        {
          id: "token-2",
          name: "Old key",
          createdAt: "2026-01-10T12:00:00.000Z",
          expiresAt: "2026-01-11T12:00:00.000Z",
          status: "EXPIRED",
        },
      ]),
    );
    renderComponent();

    expect(await screen.findByText("Claude Desktop")).toBeInTheDocument();
    expect(screen.getByText("Old key")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Status: All" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Expired" }));

    expect(await screen.findByText("Old key")).toBeInTheDocument();
    expect(screen.queryByText("Claude Desktop")).not.toBeInTheDocument();
  });

  it("paginates keys ten at a time", async () => {
    (McpTokenApi.list as jest.Mock).mockResolvedValue(
      successResponse(
        Array.from({ length: 11 }, (_, index) => ({
          id: `token-${index + 1}`,
          name: `Key ${index + 1}`,
          createdAt: "2026-07-10T12:00:00.000Z",
          expiresAt: "2026-10-08T12:00:00.000Z",
          status: "ACTIVE",
        })),
      ),
    );
    renderComponent();

    expect(await screen.findByText("Key 1")).toBeInTheDocument();
    expect(screen.getByText("Key 10")).toBeInTheDocument();
    expect(screen.queryByText("Key 11")).not.toBeInTheDocument();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText("Key 11")).toBeInTheDocument();
    expect(screen.queryByText("Key 1")).not.toBeInTheDocument();
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));

    expect(await screen.findByText("Key 1")).toBeInTheDocument();
    expect(screen.queryByText("Key 11")).not.toBeInTheDocument();
  });
});
