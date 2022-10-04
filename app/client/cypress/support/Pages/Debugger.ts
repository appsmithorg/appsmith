import { ObjectsRegistry } from "../Objects/Registry";

export class Debugger {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public commonLocators = ObjectsRegistry.CommonLocators;

  public readonly locators = {
    _debuggerIcon: ".t--debugger svg",
    _debuggerTabsContainer: ".t--debugger-tabs-container",
    _closeDebuggerButton: ".t--close-debugger",
  };

  Open() {
    this.agHelper.GetNClick(this.locators._debuggerIcon);
  }

  isOpen() {
    this.agHelper.AssertElementExist(this.locators._debuggerTabsContainer);
  }

  Close() {
    this.agHelper.GetNClick(this.locators._closeDebuggerButton);
  }

  isClosed() {
    this.agHelper.AssertElementAbsence(this.locators._debuggerTabsContainer);
  }
}
