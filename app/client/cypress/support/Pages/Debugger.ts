import { ObjectsRegistry } from "../Objects/Registry";

export class Debugger {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private commonLocators = ObjectsRegistry.CommonLocators;

  public readonly locators = {
    debuggerIcon: ".t--debugger svg",
    tabsContainer: ".t--debugger-tabs-container",
    closeButton: ".t--close-debugger",
    logMessage: ".t--debugger-log-message",
    logState: ".t--debugger-log-state",
    errorCount: ".t--debugger-count",
    clearLogs: ".t--debugger-clear-logs",
    logMessageOccurence: ".t--debugger-log-message-occurence",
    debuggerMessage: ".t--debugger-message",
    contextMenuItem: ".t--debugger-contextual-menuitem",
    debuggerLabel: "span.debugger-label",
  };

  clickDebuggerIcon(
    index?: number,
    force?: boolean,
    waitTimeInterval?: number,
  ) {
    this.agHelper.GetNClick(
      this.locators.debuggerIcon,
      index,
      force,
      waitTimeInterval,
    );
  }

  isOpen() {
    this.agHelper.AssertElementExist(this.locators.tabsContainer);
  }

  close() {
    this.agHelper.GetNClick(this.locators.closeButton);
  }

  isClosed() {
    this.agHelper.AssertElementAbsence(this.locators.tabsContainer);
  }

  doesConsoleLogExist(text: string) {
    this.agHelper.GetNAssertContains(this.locators.logMessage, text);
  }

  logStateContains(text: string, index?: number) {
    this.agHelper.GetNAssertContains(
      this.locators.logState,
      text,
      "exist",
      index,
    );
  }

  isErrorCount(count: number) {
    count > 0
      ? this.agHelper.GetNAssertContains(this.locators.errorCount, count)
      : this.agHelper.AssertElementAbsence(this.locators.errorCount);
  }

  clearLogs() {
    this.agHelper.GetNClick(this.locators.clearLogs);
  }

  is_Consecutive_Console_Log_Count(count: number) {
    count > 0
      ? this.agHelper.GetNAssertContains(
          this.locators.logMessageOccurence,
          count,
        )
      : this.agHelper.AssertElementAbsence(this.locators.logMessageOccurence);
  }

  visibleErrorMessagesCount(count: number) {
    if (count > 0) {
      this.agHelper.AssertElementVisible(this.locators.debuggerMessage);
      this.agHelper.AssertElementLength(this.locators.debuggerMessage, count);
    } else {
      this.agHelper.AssertElementAbsence(this.locators.debuggerMessage);
    }
  }

  clickErrorMessage(index?: number) {
    this.agHelper.GetNClick(this.locators.debuggerMessage, index);
  }

  isContextMenuItemVisible() {
    this.agHelper.AssertElementVisible(this.locators.contextMenuItem);
  }

  assertDebugError(label: string, message: string) {
    this.clickDebuggerIcon();
    this.agHelper.GetNClick(this.commonLocators._errorTab, 0, true, 0);
    this.agHelper
      .GetText(this.locators.debuggerLabel, "text", 0)
      .then(($text) => {
        expect($text).to.eq(label);
      });
    this.agHelper
      .GetText(this.locators.debuggerMessage, "text", 0)
      .then(($text) => {
        expect($text).to.contains(message);
      });
  }
}
