import { ObjectsRegistry } from "../Objects/Registry";

export enum PageType {
  Canvas,
  API,
  Query,
  JsEditor,
}

export class DebuggerHelper {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private commonLocators = ObjectsRegistry.CommonLocators;

  // ActionExecutionResizerHeight -> in repo
  private readonly bottomPaneHeight = 307;
  // from design system
  private readonly TAB_MIN_HEIGHT = 36;

  public readonly locators = {
    _debuggerIcon: ".t--debugger svg",
    _debuggerToggle: "[data-cy=t--debugger-toggle]",
    _debuggerDownStreamErrMsg: "[data-cy=t--debugger-downStreamErrorMsg]",
    _tabsContainer: ".t--debugger-tabs-container",
    _closeButton: ".t--close-debugger",
    _logMessage: ".t--debugger-log-message",
    _logEntityLink: ".t--debugger-log-entity-link",
    _logState: ".t--debugger-log-state",
    _errorCount: ".t--debugger-count",
    _clearLogs: ".t--debugger-clear-logs",
    _logMessageOccurence: ".t--debugger-log-message-occurence",
    _debuggerMessage: "[data-cy=t--debugger-log-message]",
    _contextMenuIcon: ".t--debugger-contextual-error-menu ",
    _contextMenuItem: ".t--debugger-contextual-menuitem",
    _debuggerLabel: "span.debugger-label",
    _bottomPaneContainer: {
      [PageType.API]: ".t--api-bottom-pane-container",
      [PageType.Query]: ".t--query-bottom-pane-container",
      [PageType.JsEditor]: ".t--js-editor-bottom-pane-container",
    },
    _debuggerList: ".debugger-list",
    _debuggerFilter: ".debugger-search",
  };

  ClickDebuggerIcon(
    index?: number,
    force?: boolean,
    waitTimeInterval?: number,
  ) {
    this.agHelper.GetNClick(
      this.locators._debuggerIcon,
      index,
      force,
      waitTimeInterval,
    );
  }

  ClickDebuggerToggle(expand = true, index = 0) {
    cy.get(this.locators._debuggerToggle)
      .eq(index)
      .invoke("attr", "data-isOpen")
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

  Close(pageType: PageType) {
    switch (pageType) {
      case PageType.Canvas:
        this.agHelper.GetNClick(this.locators._closeButton);
        break;
      case PageType.API:
      case PageType.Query:
      case PageType.JsEditor:
        this.agHelper.GetNClick(this.commonLocators._bottomPaneCollapseIcon);
        break;
    }
  }

  AssertOpen(pageType: PageType) {
    switch (pageType) {
      case PageType.Canvas:
        this.agHelper.AssertElementExist(this.locators._tabsContainer);
        break;
      case PageType.API:
      case PageType.JsEditor:
        this.agHelper.AssertHeight(
          this.locators._bottomPaneContainer[pageType],
          this.bottomPaneHeight,
        );
        break;
      case PageType.Query:
        this.agHelper.AssertHeight(
          this.locators._bottomPaneContainer[pageType],
          this.bottomPaneHeight - 1, // -1 to offset error
        );
        break;
    }
  }

  AssertClosed(pageType: PageType) {
    switch (pageType) {
      case PageType.Canvas:
        this.agHelper.AssertElementAbsence(this.locators._tabsContainer);
        break;
      case PageType.API:
      case PageType.JsEditor:
        this.agHelper.AssertHeight(
          this.locators._bottomPaneContainer[pageType],
          this.TAB_MIN_HEIGHT,
        );
        break;
      case PageType.Query:
        this.agHelper.AssertHeight(
          this.locators._bottomPaneContainer[pageType],
          this.TAB_MIN_HEIGHT - 1, // -1 to offset error
        );
        break;
    }
  }

  DoesConsoleLogExist(
    text: string,
    exists = true,
    index?: number,
    timeout?: number,
  ) {
    this.agHelper.GetNAssertContains(
      this.locators._logMessage,
      text,
      exists ? "exist" : "not.exist",
      index,
      timeout,
    );
  }

  filter(text: string) {
    this.agHelper.RemoveCharsNType(this.locators._debuggerFilter, -1, text);
  }

  LogStateContains(text: string, index?: number) {
    this.agHelper.GetNAssertContains(
      this.locators._logState,
      text,
      "exist",
      index,
    );
  }

  AssertErrorCount(count: number) {
    count > 0
      ? this.agHelper.GetNAssertContains(this.locators._errorCount, count)
      : this.agHelper.AssertElementAbsence(this.locators._errorCount);
  }

  ClearLogs() {
    this.agHelper.GetNClick(this.locators._clearLogs);
  }

  Assert_Consecutive_Console_Log_Count(count: number) {
    count > 0
      ? this.agHelper.GetNAssertContains(
          this.locators._logMessageOccurence,
          count,
        )
      : this.agHelper.AssertElementAbsence(this.locators._logMessageOccurence);
  }

  AssertVisibleErrorMessagesCount(count: number) {
    if (count > 0) {
      this.agHelper.AssertElementVisible(this.locators._debuggerMessage);
      this.agHelper.AssertElementLength(this.locators._debuggerMessage, count);
    } else {
      this.agHelper.AssertElementAbsence(this.locators._debuggerMessage);
    }
  }

  ClickErrorMessage(index?: number) {
    this.agHelper.GetNClick(this.locators._debuggerMessage, index);
  }

  ClicklogEntityLink(index?: number) {
    this.agHelper.GetNClick(this.locators._logEntityLink, index);
  }

  AssertContextMenuItemVisible() {
    this.agHelper.AssertElementVisible(this.locators._contextMenuItem);
  }

  AssertDebugError(
    label: string,
    message: string,
    shouldOpenDebugger = true,
    shouldToggleDebugger = true,
  ) {
    if (shouldOpenDebugger) {
      this.ClickDebuggerIcon();
    }
    this.agHelper.GetNClick(this.commonLocators._errorTab, 0, true, 0);

    if (shouldToggleDebugger) {
      this.ClickDebuggerToggle();
    }

    this.agHelper
      .GetText(this.locators._debuggerLabel, "text", 0)
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
}
