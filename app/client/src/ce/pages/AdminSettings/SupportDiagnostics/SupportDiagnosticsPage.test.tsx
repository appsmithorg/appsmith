import "@testing-library/jest-dom";
import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { ThemeProvider } from "styled-components";
import { Toast } from "@appsmith/ads";
import { theme } from "constants/DefaultTheme";
import SupportDiagnosticsApi from "ee/api/SupportDiagnosticsApi";
import type { AdminConfigType } from "ee/pages/AdminSettings/config/types";
import type { SectionId, SectionResult, SectionStatus } from "./types";
import { SECTION_IDS } from "./types";
import { saveBytes, zipReport } from "./zipReport";
import { SupportDiagnosticsPage } from "./SupportDiagnosticsPage";
import { SMARTLOOK_MASK_CLASS } from "./DownloadPanel";

jest.mock("ee/api/SupportDiagnosticsApi", () => ({
  __esModule: true,
  default: {
    listSections: jest.fn(),
    collectSection: jest.fn(),
    recordDownload: jest.fn(),
  },
}));

jest.mock("./zipReport", () => ({
  ...jest.requireActual("./zipReport"),
  zipReport: jest.fn(),
  saveBytes: jest.fn(),
}));

const listSections = SupportDiagnosticsApi.listSections as jest.Mock;
const collectSection = SupportDiagnosticsApi.collectSection as jest.Mock;
const recordDownload = SupportDiagnosticsApi.recordDownload as jest.Mock;
const zipReportMock = zipReport as jest.Mock;
const saveBytesMock = saveBytes as jest.Mock;

const VALID_PASSWORD = "correct-hor1";
const COLLECTED_AT = "2026-03-04T12:00:00.000Z";

function ok<T>(data: T) {
  return { responseMeta: { status: 200, success: true }, data };
}

function failure(status: number) {
  return {
    responseMeta: { status, success: false, error: { code: "x", message: "" } },
    data: null,
  };
}

function section(
  sectionId: SectionId,
  status: SectionStatus,
  data: Record<string, unknown> | null = null,
  errorCode: string | null = null,
): SectionResult {
  return {
    sectionId,
    status,
    collectedAt: status === "OK" ? COLLECTED_AT : null,
    data,
    errorCode,
  };
}

function defaultSections(): SectionResult[] {
  return [
    section("INSTANCE", "OK", {
      edition: "CE",
      version: "v1.50",
      configuredPublicUrl: "https://configured.example.com",
    }),
    section("DEPLOYMENT", "OK", {
      tool: { value: "DOCKER", source: "env", confidence: "HIGH" },
    }),
    section("FEATURE_FLAGS", "OK", { flags: { release_x_enabled: true } }),
    section("APPLICATIONS", "OK", { applicationCount: 3 }),
    section("DATASOURCES", "NOT_SUPPORTED"),
    section("WORKFLOWS", "NOT_LICENSED"),
    section("IDENTITY", "UNKNOWN", null, "license_unknown"),
    section("AI_MCP", "UNAVAILABLE", null, "timeout"),
    section("HEALTH", "OK", { status: "UP" }),
  ];
}

function listWith(sections: SectionResult[]) {
  listSections.mockResolvedValue(ok({ collectorVersion: "1.0.0", sections }));
}

function replaceSection(replacement: SectionResult): SectionResult[] {
  return defaultSections().map((s) =>
    s.sectionId === replacement.sectionId ? replacement : s,
  );
}

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

const CATEGORY = { type: "support" } as unknown as AdminConfigType;

interface StoreOptions {
  multiOrg?: boolean;
  isSuperUser?: boolean;
}

function renderPage({
  isSuperUser = true,
  multiOrg = false,
}: StoreOptions = {}) {
  const store = configureStore()({
    ui: {
      users: {
        currentUser: {
          email: "admin@example.com",
          isSuperUser,
          adminSettingsVisible: true,
        },
        featureFlag: {
          data: { license_multi_org_enabled: multiOrg },
          overriddenFlags: {},
        },
      },
    },
  });

  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <SupportDiagnosticsPage category={CATEGORY} />
      </ThemeProvider>
    </Provider>,
  );
}

function renderWithToasts() {
  render(<Toast />);

  return renderPage();
}

function downloadButton() {
  return screen.getByTestId("t--support-diagnostics-download");
}

function passwordInput() {
  return screen.getByTestId("t--support-diagnostics-password");
}

async function waitForReady() {
  await waitFor(() => expect(downloadButton()).toBeEnabled());
}

function typePassword(value: string) {
  fireEvent.change(passwordInput(), { target: { value } });
}

function filesPassedToZip(): Record<string, string> {
  return zipReportMock.mock.calls[0][0];
}

describe("SupportDiagnosticsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listWith(defaultSections());
    collectSection.mockImplementation(async (id: SectionId) =>
      ok(section(id, "OK", { refreshed: true })),
    );
    recordDownload.mockResolvedValue(ok(null));
    zipReportMock.mockResolvedValue(new Uint8Array([1, 2, 3]));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("rendering and statuses", () => {
    it("should_renderEverySection_when_listLoaded", async () => {
      renderPage();

      await waitForReady();

      const headings = screen.getAllByRole("heading", { level: 2 });

      expect(headings.map((h) => h.textContent)).toEqual([
        "Instance and runtime",
        "Deployment and infrastructure",
        "Feature flags and entitlements",
        "Applications and pages",
        "Datasources and integrations",
        "Workflows and automation",
        "Identity, access and governance",
        "AI and MCP",
        "Platform health",
      ]);
      SECTION_IDS.forEach((id) =>
        expect(
          screen.getByTestId(`t--support-diagnostics-card-${id}`),
        ).toBeInTheDocument(),
      );
      const expectStatus = (id: SectionId, tag: string, detail?: string) => {
        const card = within(
          screen.getByTestId(`t--support-diagnostics-card-${id}`),
        );

        expect(card.getByText(tag).closest(".ads-v2-tag")).not.toBeNull();

        if (detail) expect(card.getByText(detail)).toBeVisible();
      };

      expectStatus(
        "DATASOURCES",
        "Not available",
        "Not available in this edition.",
      );
      expectStatus("WORKFLOWS", "Not in plan", "Not included in your plan.");
      expectStatus(
        "IDENTITY",
        "Unknown",
        "Appsmith could not check your license for this section.",
      );
      expectStatus(
        "AI_MCP",
        "Timed out",
        "Collection took longer than 10 seconds.",
      );
      expect(
        within(
          screen.getByTestId("t--support-diagnostics-card-AI_MCP"),
        ).getByText(
          "If included, the ZIP records only that this section could not be collected.",
        ),
      ).toBeVisible();
      expectStatus("HEALTH", "Collected");

      const time = screen
        .getByTestId("t--support-diagnostics-card-HEALTH")
        .querySelector("time");

      expect(time).toHaveAttribute("dateTime", COLLECTED_AT);
      expect(time).toHaveAttribute("title", `${COLLECTED_AT} (UTC)`);
      expect(time).toBeVisible();

      const checkbox = screen.getByRole("checkbox", {
        name: "Include Platform health in ZIP",
      });

      expect(checkbox).toBeChecked();
      expect(checkbox.closest("label")).toHaveTextContent(/^Include in ZIP$/);
      expect(
        screen.getByRole("button", { name: "Refresh Platform health" }),
      ).toHaveTextContent(/^Refresh$/);
      expect(
        screen.getByRole("button", { name: "Retry AI and MCP" }),
      ).toHaveTextContent(/^Retry$/);
    });

    it("should_refreshRelativeTime_when_aMinutePasses", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-03-04T12:00:10.000Z"));

      const setIntervalSpy = jest.spyOn(window, "setInterval");
      const clearIntervalSpy = jest.spyOn(window, "clearInterval");
      const { unmount } = renderPage();

      await waitForReady();

      const time = () =>
        screen
          .getByTestId("t--support-diagnostics-card-HEALTH")
          .querySelector("time") as HTMLElement;
      const before = time().textContent;

      expect(before).toBe("a few seconds ago");
      expect(time()).toHaveAttribute("title", `${COLLECTED_AT} (UTC)`);

      act(() => {
        jest.advanceTimersByTime(3 * 60_000);
      });

      expect(time().textContent).toBe("3 minutes ago");
      expect(time()).toHaveAttribute("title", `${COLLECTED_AT} (UTC)`);

      const timeIntervals = setIntervalSpy.mock.results
        .filter((_, index) => setIntervalSpy.mock.calls[index][1] === 60_000)
        .map((r) => r.value);

      expect(timeIntervals.length).toBeGreaterThan(0);

      unmount();

      timeIntervals.forEach((handle) =>
        expect(clearIntervalSpy).toHaveBeenCalledWith(handle),
      );
      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });

    it("should_collapseCards_byDefault_andExpandOnHeaderClick", async () => {
      renderPage();

      await waitForReady();

      const instanceUrl = screen.getByTestId(
        "t--support-diagnostics-instance-url",
      );
      const toggle = screen.getByRole("button", {
        name: "Instance and runtime",
      });

      expect(instanceUrl).not.toBeVisible();
      expect(toggle).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(toggle);

      expect(instanceUrl).toBeVisible();
      expect(toggle).toHaveAttribute("aria-expanded", "true");
    });

    it("should_showInstanceBrowserFields", async () => {
      renderPage();

      await waitForReady();

      const card = within(
        screen.getByTestId("t--support-diagnostics-card-INSTANCE"),
      );

      expect(
        card.getByTestId("t--support-diagnostics-instance-url"),
      ).toHaveTextContent(window.location.origin);

      const mismatchLabel = card.getByText("Public URL mismatch");
      const mismatchValue = mismatchLabel.closest("dt")
        ?.nextElementSibling as HTMLElement;

      expect(mismatchValue).toHaveTextContent("Yes");
    });

    it("should_announceProgress_when_sectionsSettle", async () => {
      renderPage();

      await waitForReady();

      const live = screen.getByTestId("t--support-diagnostics-progress");

      expect(live).toHaveAttribute("aria-live", "polite");
      // IDENTITY is UNKNOWN and AI_MCP is UNAVAILABLE in the default list.
      expect(live).toHaveTextContent(
        /^Collection finished\. 2 sections could not be collected\.$/,
      );
      expect(live).not.toHaveTextContent("All sections collected.");
    });

    it("should_countUnknownAsNotCollected_when_progressFinishes", async () => {
      listWith(
        SECTION_IDS.map((id) =>
          id === "HEALTH"
            ? section("HEALTH", "UNKNOWN")
            : section(id, "OK", { ok: true }),
        ),
      );
      renderPage();

      await waitForReady();

      const live = screen.getByTestId("t--support-diagnostics-progress");

      expect(live).toHaveTextContent(
        /^Collection finished\. 1 section could not be collected\.$/,
      );
      expect(live).not.toHaveTextContent("All sections collected.");
    });

    it("should_announceAllCollected_when_noSectionFailed", async () => {
      // NOT_SUPPORTED and NOT_LICENSED (in the default list) are expected
      // outcomes, not failures.
      listWith(
        defaultSections().map((s) =>
          s.sectionId === "AI_MCP" || s.sectionId === "IDENTITY"
            ? section(s.sectionId, "OK", { ok: true })
            : s,
        ),
      );
      renderPage();

      await waitForReady();

      expect(
        screen.getByTestId("t--support-diagnostics-progress"),
      ).toHaveTextContent(/^All sections collected\.$/);
    });

    it("should_useCountCopy_when_zeroOrOneSectionIncluded", async () => {
      renderPage();

      await waitForReady();
      fireEvent.click(screen.getByTestId("t--support-diagnostics-clear-all"));
      expect(downloadButton()).toHaveTextContent(/^Download ZIP$/);

      fireEvent.click(
        screen.getByTestId("t--support-diagnostics-include-HEALTH"),
      );
      expect(downloadButton()).toHaveTextContent(
        /^Download ZIP \(1 section\)$/,
      );
    });

    it("should_showBusyAndExportStatusRecord_when_collectResolves429", async () => {
      listWith(replaceSection(section("HEALTH", "NOT_COLLECTED")));
      collectSection.mockResolvedValue(failure(429));
      renderPage();

      await waitForReady();

      const card = within(
        screen.getByTestId("t--support-diagnostics-card-HEALTH"),
      );

      expect(card.getByText("Busy")).toBeInTheDocument();
      expect(
        card.getByText("Another collection is running. Try again in a moment."),
      ).toBeVisible();
      expect(
        card.getByTestId("t--support-diagnostics-retry-HEALTH"),
      ).toBeEnabled();
      fireEvent.click(downloadButton());

      await waitFor(() => expect(zipReportMock).toHaveBeenCalledTimes(1));
      expect(JSON.parse(filesPassedToZip()["health.json"])).toEqual({
        sectionId: "HEALTH",
        status: "NOT_COLLECTED",
        errorCode: null,
      });
    });
  });

  describe("download gate", () => {
    it.each([
      {
        name: "none selected",
        reason: "Include at least one section in the ZIP.",
        setup: async () => {
          fireEvent.click(
            screen.getByTestId("t--support-diagnostics-clear-all"),
          );
        },
      },
      {
        name: "a selected section collecting",
        reason: "Wait for the included sections to finish collecting.",
        setup: async () => {
          // HEALTH is mid-collection; nothing to do.
        },
        prepare: () => {
          listWith(replaceSection(section("HEALTH", "NOT_COLLECTED")));
          collectSection.mockReturnValue(new Promise(() => undefined));
        },
      },
      {
        name: "an 11-character password after blur",
        reason: "Use 12 to 128 characters, or leave the password empty.",
        setup: async () => {
          typePassword("12345678901");
          fireEvent.blur(passwordInput());
        },
      },
    ])(
      "should_disableDownload_withVisibleReason ($name)",
      async ({ prepare, reason, setup }) => {
        prepare?.();
        renderPage();

        await screen.findByTestId("t--support-diagnostics-card-HEALTH");
        await waitFor(() => expect(listSections).toHaveBeenCalledTimes(1));
        await act(setup);

        await waitFor(() => expect(downloadButton()).toBeDisabled());

        const reasonText = screen.getByText(reason);
        const describedBy = downloadButton().getAttribute("aria-describedby");

        expect(describedBy).toBeTruthy();
        expect(
          (describedBy as string)
            .split(" ")
            .map((id) => document.getElementById(id)),
        ).toContain(reasonText.closest("[id]"));
        expect(reasonText).toBeVisible();
      },
    );

    it("should_selectAllAgain_when_selectAllClicked", async () => {
      renderPage();

      await waitForReady();
      fireEvent.click(screen.getByTestId("t--support-diagnostics-clear-all"));
      expect(downloadButton()).toBeDisabled();
      expect(
        screen.getByTestId("t--support-diagnostics-download-reason"),
      ).toHaveTextContent("Include at least one section in the ZIP.");
      fireEvent.click(screen.getByTestId("t--support-diagnostics-select-all"));
      expect(
        screen.queryByTestId("t--support-diagnostics-download-reason"),
      ).toBeNull();
      expect(downloadButton()).toBeEnabled();
      expect(downloadButton()).toHaveTextContent("Download ZIP (9 sections)");
    });
  });

  describe("password field", () => {
    it("should_markPasswordFieldNotALoginField", async () => {
      renderPage();

      await waitForReady();

      const input = passwordInput();

      expect(input).toHaveAttribute("autocomplete", "new-password");
      expect(input).toHaveAttribute("name", "diagnostics-zip-password");
      expect(input).toHaveAttribute("type", "password");
      expect(input.closest(`.${SMARTLOOK_MASK_CLASS}`)).not.toBeNull();
      expect(input).toHaveAttribute("data-recording-sensitive");
      expect(input).toHaveAttribute("data-1p-ignore");
      expect(input).toHaveAttribute("data-lpignore", "true");
      expect(input).toHaveAttribute("data-bwignore");
    });

    it("should_notSubmit_when_enterPressedInPassword", async () => {
      const hrefBefore = window.location.href;

      renderPage();

      await waitForReady();
      jest.clearAllMocks();

      typePassword(VALID_PASSWORD);
      fireEvent.keyDown(passwordInput(), { key: "Enter", code: "Enter" });
      fireEvent.keyPress(passwordInput(), {
        key: "Enter",
        code: "Enter",
        charCode: 13,
      });
      fireEvent.keyUp(passwordInput(), { key: "Enter", code: "Enter" });

      await act(async () => undefined);

      expect(window.location.href).toBe(hrefBefore);
      expect(window.location.href).not.toContain(VALID_PASSWORD);
      expect(recordDownload).not.toHaveBeenCalled();
      expect(zipReportMock).not.toHaveBeenCalled();
      expect(saveBytesMock).not.toHaveBeenCalled();
      expect(passwordInput().closest("form")).toBeNull();
    });

    it("should_showAesWarning_when_validPasswordTyped", async () => {
      renderPage();

      await waitForReady();
      expect(
        screen.getByText(
          "Password-protected ZIPs need 7-Zip, Keka, or WinZip to open.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(
          "The built-in Windows and macOS archive tools cannot open this ZIP.",
        ),
      ).toBeNull();

      typePassword(VALID_PASSWORD);
      fireEvent.blur(passwordInput());

      expect(downloadButton()).toBeEnabled();
      expect(
        screen.getByText(
          "The built-in Windows and macOS archive tools cannot open this ZIP.",
        ),
      ).toBeInTheDocument();
    });

    it("should_validatePassword_when_downloadClickedBeforeBlur", async () => {
      renderPage();

      await waitForReady();
      typePassword("12345678901");
      expect(
        screen.queryByText(
          "Use 12 to 128 characters, or leave the password empty.",
        ),
      ).toBeNull();
      fireEvent.click(downloadButton());

      expect(
        await screen.findByText(
          "Use 12 to 128 characters, or leave the password empty.",
        ),
      ).toBeInTheDocument();
      expect(passwordInput()).toHaveAttribute("aria-invalid", "true");
      expect(downloadButton()).toBeDisabled();
      expect(zipReportMock).not.toHaveBeenCalled();
      expect(saveBytesMock).not.toHaveBeenCalled();
    });

    it("should_togglePasswordVisibility", async () => {
      renderPage();

      await waitForReady();
      const show = screen.getByRole("button", { name: "Show password" });

      expect(show).not.toHaveAttribute("aria-pressed");
      fireEvent.click(show);
      expect(passwordInput()).toHaveAttribute("type", "text");

      const hide = screen.getByRole("button", { name: "Hide password" });

      expect(hide).not.toHaveAttribute("aria-pressed");
      fireEvent.click(hide);
      expect(passwordInput()).toHaveAttribute("type", "password");
    });

    it("should_buildOneZip_when_downloadDoubleClicked", async () => {
      renderPage();

      await waitForReady();
      fireEvent.click(downloadButton());
      fireEvent.click(downloadButton());

      await waitFor(() => expect(saveBytesMock).toHaveBeenCalledTimes(1));
      expect(zipReportMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("download flow", () => {
    it("should_downloadAndRecord_when_downloadClicked", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-03-04T23:30:00.000Z"));
      renderPage();

      await waitForReady();
      typePassword(VALID_PASSWORD);
      fireEvent.click(downloadButton());

      const fileName = "appsmith-support-diagnostics-encrypted-20260304.zip";

      expect(
        await screen.findByText(
          `Saved ${fileName}. Attach it to your support ticket, and send the password to support another way.`,
        ),
      ).toBeInTheDocument();
      await waitFor(() => expect(recordDownload).toHaveBeenCalledTimes(1));

      expect(zipReportMock.mock.calls[0][1]).toBe(VALID_PASSWORD);
      expect(saveBytesMock).toHaveBeenCalledWith(
        expect.any(Uint8Array),
        fileName,
      );
      expect(zipReportMock.mock.invocationCallOrder[0]).toBeLessThan(
        saveBytesMock.mock.invocationCallOrder[0],
      );
      expect(saveBytesMock.mock.invocationCallOrder[0]).toBeLessThan(
        recordDownload.mock.invocationCallOrder[0],
      );
      expect(recordDownload).toHaveBeenCalledWith({
        sectionIds: [...SECTION_IDS],
        encrypted: true,
      });

      const apiArgs = JSON.stringify([
        listSections.mock.calls,
        collectSection.mock.calls,
        recordDownload.mock.calls,
      ]);

      expect(apiArgs).not.toContain(VALID_PASSWORD);
      Object.values(filesPassedToZip()).forEach((text) =>
        expect(text).not.toContain(VALID_PASSWORD),
      );
      expect(
        screen
          .getByText(new RegExp(`Saved ${fileName}`))
          .closest("[role='status']"),
      ).not.toBeNull();
    });

    it("should_downloadUnencrypted_when_passwordEmpty", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-03-04T23:30:00.000Z"));
      renderPage();

      await waitForReady();
      fireEvent.click(
        screen.getByTestId("t--support-diagnostics-include-HEALTH"),
      );
      fireEvent.click(downloadButton());

      const fileName = "appsmith-support-diagnostics-20260304.zip";

      expect(
        await screen.findByText(
          `Saved ${fileName}. Attach it to your support ticket.`,
        ),
      ).toBeInTheDocument();
      expect(zipReportMock.mock.calls[0][1]).toBeUndefined();
      expect(filesPassedToZip()["health.json"]).toBeUndefined();
      await waitFor(() =>
        expect(recordDownload).toHaveBeenCalledWith({
          sectionIds: SECTION_IDS.filter((id) => id !== "HEALTH"),
          encrypted: false,
        }),
      );
    });

    it.each([
      {
        name: "resolved failure(403)",
        arrange: () => recordDownload.mockResolvedValue(failure(403)),
      },
      {
        name: "a rejection",
        arrange: () => recordDownload.mockRejectedValue(new Error("down")),
      },
    ])(
      "should_keepDownload_when_auditCallFails ($name)",
      async ({ arrange }) => {
        arrange();
        renderWithToasts();

        await waitForReady();
        fireEvent.click(downloadButton());

        expect(
          await screen.findByText(
            "The ZIP was saved, but this download could not be recorded.",
          ),
        ).toBeInTheDocument();
        expect(saveBytesMock).toHaveBeenCalledTimes(1);

        const fileName = saveBytesMock.mock.calls[0][1];
        const saved = screen.getByText(
          `Saved ${fileName}. Attach it to your support ticket.`,
        );

        expect(saved).toBeVisible();
        expect(saved.closest("[role='status']")).not.toBeNull();
      },
    );

    it("should_showTooLargeError_when_reportTooLarge", async () => {
      listWith(
        replaceSection(
          section("APPLICATIONS", "OK", { blob: "x".repeat(1_100_000) }),
        ),
      );
      renderPage();

      await waitForReady();
      fireEvent.click(downloadButton());

      expect(
        await screen.findByText(
          "The report is larger than 1 MB. Leave out some sections and try again.",
        ),
      ).toBeInTheDocument();
      expect(zipReportMock).not.toHaveBeenCalled();
      expect(saveBytesMock).not.toHaveBeenCalled();
      expect(recordDownload).not.toHaveBeenCalled();
    });

    it("should_showGenericError_when_zipFails", async () => {
      zipReportMock.mockRejectedValue(new Error("secret-detail"));
      renderPage();

      await waitForReady();
      fireEvent.click(downloadButton());

      expect(
        await screen.findByText("The ZIP could not be created. Try again."),
      ).toBeInTheDocument();
      expect(screen.queryByText(/secret-detail/)).toBeNull();
      expect(document.body.textContent).not.toContain("secret-detail");
      expect(saveBytesMock).not.toHaveBeenCalled();
      expect(recordDownload).not.toHaveBeenCalled();
      expect(downloadButton()).toBeEnabled();
    });

    it("should_includeStatusRecord_when_selectedSectionFailed", async () => {
      listWith(replaceSection(section("HEALTH", "NOT_COLLECTED")));
      collectSection.mockRejectedValue(new Error("network"));
      renderPage();

      await waitForReady();
      expect(
        within(
          screen.getByTestId("t--support-diagnostics-card-HEALTH"),
        ).getByText("This section could not be collected."),
      ).toBeInTheDocument();
      fireEvent.click(downloadButton());

      await waitFor(() => expect(zipReportMock).toHaveBeenCalledTimes(1));
      expect(JSON.parse(filesPassedToZip()["health.json"])).toEqual({
        sectionId: "HEALTH",
        status: "NOT_COLLECTED",
        errorCode: null,
      });
    });
  });

  describe("access and visibility", () => {
    it("should_renderNothing_when_multiOrgEnabled", async () => {
      const { container } = renderPage({ multiOrg: true });

      await act(async () => undefined);

      expect(container).toBeEmptyDOMElement();
      expect(listSections).not.toHaveBeenCalled();
      expect(collectSection).not.toHaveBeenCalled();
    });

    it("should_renderNothing_when_userNotSuperUser", async () => {
      const { container } = renderPage({ isSuperUser: false });

      await act(async () => undefined);

      expect(container).toBeEmptyDOMElement();
      expect(listSections).not.toHaveBeenCalled();
    });

    it("should_showForbidden_when_listResolves403", async () => {
      listSections.mockResolvedValue(failure(403));
      renderPage();

      expect(
        await screen.findByText(
          "Only instance administrators can use this page.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("t--support-diagnostics-download"),
      ).toBeNull();
    });

    it("should_showSpinner_while_listLoads", async () => {
      listSections.mockReturnValue(new Promise(() => undefined));
      renderPage();

      expect(
        screen.getByRole("status", { name: "Loading diagnostics" }),
      ).toBeInTheDocument();
    });

    it("should_reloadList_when_retryClickedAfterListFailure", async () => {
      listSections.mockResolvedValueOnce(failure(500));
      renderPage();

      expect(
        await screen.findByText("Could not load the diagnostics."),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByTestId("t--support-diagnostics-reload"));

      await waitForReady();
      expect(listSections).toHaveBeenCalledTimes(2);
    });
  });

  describe("refresh and retry", () => {
    it("should_retryAndRefreshSection", async () => {
      listWith(replaceSection(section("HEALTH", "NOT_COLLECTED")));
      collectSection.mockRejectedValueOnce(new Error("network"));
      renderPage();

      const retry = await screen.findByTestId(
        "t--support-diagnostics-retry-HEALTH",
      );

      await waitFor(() => expect(retry).toBeEnabled());
      collectSection.mockClear();

      const retryCall = deferred<unknown>();

      collectSection.mockReturnValueOnce(retryCall.promise);
      fireEvent.click(retry);

      await waitFor(() =>
        expect(collectSection).toHaveBeenCalledWith("HEALTH"),
      );
      await waitFor(() => expect(retry).toBeDisabled());
      expect(retry).toBeInTheDocument();

      await act(async () => {
        retryCall.resolve(ok(section("HEALTH", "OK", { status: "UP" })));
      });
      await waitFor(() => expect(retry).toBeEnabled());
      // The same button stays mounted and now refreshes.
      expect(retry).toHaveAttribute(
        "data-testid",
        "t--support-diagnostics-refresh-HEALTH",
      );

      const refresh = screen.getByTestId(
        "t--support-diagnostics-refresh-INSTANCE",
      );
      const refreshCall = deferred<unknown>();

      collectSection.mockReturnValueOnce(refreshCall.promise);
      fireEvent.click(refresh);

      await waitFor(() =>
        expect(collectSection).toHaveBeenLastCalledWith("INSTANCE"),
      );
      await waitFor(() => expect(refresh).toBeDisabled());

      await act(async () => {
        refreshCall.resolve(ok(section("INSTANCE", "OK", { edition: "EE" })));
      });
      await waitFor(() => expect(refresh).toBeEnabled());
      expect(refresh).toBeInTheDocument();
    });
  });
});
