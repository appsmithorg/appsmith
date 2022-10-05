import { ObjectsRegistry } from "../Objects/Registry";

export class Debugger {
  public agHelper = ObjectsRegistry.AggregateHelper;

  public readonly locators = {
    debuggerIcon: ".t--debugger svg",
    tabsContainer: ".t--debugger-tabs-container",
    closeButton: ".t--close-debugger",
    logMessage: ".t--debugger-log-message",
    logState: ".t--debugger-log-state",
    errorCount: ".t--debugger-count",
    clearLogs: ".t--debugger-clear-logs",
    logMessageOccurence: ".t--debugger-log-message-occurence",
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

  logStateContains(text: string) {
    this.agHelper.GetNAssertContains(this.locators.logState, text);
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
}
