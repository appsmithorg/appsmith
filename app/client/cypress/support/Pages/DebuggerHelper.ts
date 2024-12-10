import { ObjectsRegistry } from "../Objects/Registry";

export enum PageType {
  Canvas,
  API,
  Query,
  JsEditor,
  DataSources,
}

export class DebuggerHelper {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private commonLocators = ObjectsRegistry.CommonLocators;

  public readonly locators = {
    _debuggerIcon: ".t--debugger-count",
    _debuggerToggle: "[data-testid=t--debugger-toggle]",
    _debuggerDownStreamErrMsg: "[data-testid=t--debugger-downStreamErrorMsg]",
    _tabsContainer: ".t--debugger-tabs-container",
    _closeButton: "[data-testid=t--view-hide-button]",
    _logMessage: ".t--debugger-log-message",
    _logEntityLink: ".t--debugger-log-entity-link",
    _logState: ".t--debugger-log-state",
    _errorCount: ".t--debugger-count",
    _clearLogs: ".t--debugger-clear-logs",
    _logMessageOccurence: ".t--debugger-log-message-occurrence",
    _debuggerMessage: "[data-testid=t--debugger-log-message]",
    _contextMenuIcon: ".t--debugger-contextual-error-menu ",
    _contextMenuItem: ".t--debugger-contextual-menuitem",
    _debuggerLabel: "span.debugger-label",
    _bottomPaneContainer: ".t--ide-bottom-view",
    _ideBottomViewContainer: ".t--ide-bottom-view",
    _debuggerList: ".debugger-list",
    _debuggerFilter: "input[data-testid=t--debugger-search]",
    _debuggerSelectedTab: ".ads-v2-tabs__list-tab",
    _helpButton: "[data-testid='t--help-button']",
    _intercomOption: "#intercom-trigger",
    _intercomConsentText: "[data-testid='t--intercom-consent-text']",
    _logsTab: "[data-testid='t--tab-LOGS_TAB']",
    _debuggerFilterClear:
      "//input[@data-testid='t--debugger-search']/following-sibling::span",
    _logsGroup: "[data-testid='t--log-filter']",
    _logGroupOption: (option: string) =>
      `[data-testid='t--log-filter-${option}']`,
    _downStreamLogMessage: ".t--debugger-log-downstream-message",
  };

  OpenDebugger() {
    // Open opens if it is not open yet
    cy.get("body").then(($body) => {
      if ($body.find(this.locators._ideBottomViewContainer).length === 0) {
        this.agHelper.GetNClick(this.locators._debuggerIcon, 0, false);
      } else {
        this.agHelper.GetNClick(this.commonLocators._errorTab, 0, true, 0);
      }
    });
    this.AssertOpen();
  }

  ClickDebuggerToggle(expand = true, index = 0) {
    cy.get(this.locators._debuggerToggle)
      .eq(index)
      .invoke("attr", "data-isopen")
      .then((arrow) => {
        if (expand && arrow == "false")
          cy.get(this.locators._debuggerToggle)
            .eq(index)
            .trigger("click", { multiple: true })
            .wait(1000);
        else if (!expand && arrow == "true")
          cy.get(this.locators._debuggerToggle)
            .eq(index)
            .trigger("click", { multiple: true })
            .wait(1000);
        else this.agHelper.Sleep(500);
      });
  }

  ClickResponseTab() {
    this.agHelper.GetNClick(this.commonLocators._responseTab);
  }

  ClickLogsTab() {
    this.agHelper.GetNClick(this.locators._logsTab);
  }

  CloseBottomBar() {
    this.agHelper.GetNClick(this.locators._closeButton);
  }

  AssertOpen(pageType?: PageType) {
    switch (pageType) {
      case PageType.Canvas:
        this.agHelper.AssertElementExist(this.locators._tabsContainer);
        break;
      case PageType.API:
      case PageType.JsEditor:
      case PageType.Query:
      case PageType.DataSources:
        this.agHelper.AssertElementVisibility(
          this.locators._bottomPaneContainer,
        );
        break;
      default:
        this.agHelper.AssertElementVisibility(
          this.locators._ideBottomViewContainer,
        );
    }
  }

  AssertClosed() {
    this.agHelper.AssertElementAbsence(this.locators._tabsContainer);
  }

  AssertSelectedTab(text: string) {
    this.agHelper.GetNAssertContains(this.locators._debuggerSelectedTab, text);
    this.agHelper.AssertSelectedTab(this.locators._debuggerSelectedTab, "true");
  }

  DoesConsoleLogExist(text: string, exists = true, entityName?: string) {
    this.agHelper.GetNAssertContains(
      this.locators._logMessage,
      text,
      exists ? "exist" : "not.exist",
    );
    if (entityName) {
      this.agHelper
        .GetElement(this.locators._logMessage)
        .contains(text)
        .closest(".error")
        .contains(this.locators._logEntityLink, entityName);
    }
  }

  DebuggerLogsFilter(text: string) {
    this.agHelper.SelectAllAndType(this.locators._debuggerFilter, text);
  }

  LogStateContains(text: string, index?: number) {
    this.agHelper.GetNAssertContains(this.locators._logState, text, "exist");
  }

  AssertErrorCount(count: number) {
    const assertion = count > 0 ? `Debug (${count})` : "Debug";
    this.agHelper.GetNAssertContains(this.locators._errorCount, assertion);
  }

  changeLogsGroup(option: string) {
    this.agHelper.GetNClick(this.locators._logsGroup);
    this.agHelper.GetNClick(this.locators._logGroupOption(option));
  }

  ClearLogs() {
    this.agHelper.GetNClick(this.locators._clearLogs);
  }

  AssertConsecutiveConsoleLogCount(count: number) {
    count > 0
      ? this.agHelper.GetNAssertContains(
          this.locators._logMessageOccurence,
          count,
        )
      : this.agHelper.AssertElementAbsence(this.locators._logMessageOccurence);
  }

  AssertVisibleErrorMessagesCount(count: number) {
    if (count > 0) {
      this.agHelper.AssertElementVisibility(this.locators._debuggerMessage);
      this.agHelper.AssertElementLength(this.locators._debuggerMessage, count);
    } else {
      this.agHelper.AssertElementAbsence(this.locators._debuggerMessage);
    }
  }

  ClickErrorMessage(index?: number) {
    this.agHelper.GetNClick(this.locators._debuggerMessage, index);
  }

  ClicklogEntityLink(last = false, index?: number) {
    if (last) {
      this.agHelper.GetElement(this.locators._logEntityLink).last().click();
      return;
    }

    this.agHelper.GetNClick(this.locators._logEntityLink, index);
  }

  AssertContextMenuItemVisible() {
    this.agHelper.AssertElementVisibility(this.locators._contextMenuItem);
  }

  AssertDebugError(
    label: string,
    message: string,
    shouldOpenDebugger = true,
    shouldToggleDebugger = true,
    errorLabelIndex = 0,
  ) {
    if (shouldOpenDebugger) {
      this.OpenDebugger();
    }
    this.agHelper.GetNClick(this.commonLocators._errorTab, 0, true, 0);

    if (shouldToggleDebugger) {
      this.ClickDebuggerToggle();
    }

    this.agHelper
      .GetText(this.locators._debuggerLabel, "text", errorLabelIndex)
      .then(($text) => {
        expect($text).to.eq(label);
      });

    if (message) {
      this.agHelper
        .GetText(this.locators._debuggerDownStreamErrMsg, "text", 0)
        .then(($text) => {
          expect($text).to.contains(message);
        });
    }
  }

  DebuggerListDoesnotContain(text: string) {
    this.agHelper.AssertContains(
      text,
      "not.exist",
      this.locators._debuggerList,
    );
  }

  AssertDownStreamLogError(message: string, shouldOpenDebugger = true) {
    if (shouldOpenDebugger) {
      this.OpenDebugger();
    }

    this.agHelper.GetNClick(this.commonLocators._responseTab, 0, true, 0);

    this.agHelper
      .GetText(this.locators._downStreamLogMessage, "text", 0)
      .then(($text) => {
        expect($text).to.contains(message);
      });
  }
}
