import { ObjectsRegistry } from "../Objects/Registry";

export class Debugger {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private commonLocators = ObjectsRegistry.CommonLocators;

  public readonly locators = {
    _debuggerIcon: ".t--debugger svg",
    _tabsContainer: ".t--debugger-tabs-container",
    _closeButton: ".t--close-debugger",
    _logMessage: ".t--debugger-log-message",
    _logState: ".t--debugger-log-state",
    _errorCount: ".t--debugger-count",
    _clearLogs: ".t--debugger-clear-logs",
    _logMessageOccurence: ".t--debugger-log-message-occurence",
    _debuggerMessage: ".t--debugger-message",
    _contextMenuItem: ".t--debugger-contextual-menuitem",
    _debuggerLabel: "span.debugger-label",
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

  AssertOpen() {
    this.agHelper.AssertElementExist(this.locators._tabsContainer);
  }

  close() {
    this.agHelper.GetNClick(this.locators._closeButton);
  }

  AssertClosed() {
    this.agHelper.AssertElementAbsence(this.locators._tabsContainer);
  }

  DoesConsoleLogExist(text: string) {
    this.agHelper.GetNAssertContains(this.locators._logMessage, text);
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

  AssertContextMenuItemVisible() {
    this.agHelper.AssertElementVisible(this.locators._contextMenuItem);
  }

  AssertDebugError(label: string, message: string) {
    this.ClickDebuggerIcon();
    this.agHelper.GetNClick(this.commonLocators._errorTab, 0, true, 0);
    this.agHelper
      .GetText(this.locators._debuggerLabel, "text", 0)
      .then(($text) => {
        expect($text).to.eq(label);
      });
    this.agHelper
      .GetText(this.locators._debuggerMessage, "text", 0)
      .then(($text) => {
        expect($text).to.contains(message);
      });
  }
}
