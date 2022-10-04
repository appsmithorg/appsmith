import { ObjectsRegistry } from "../Objects/Registry";

export class Debugger {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = ObjectsRegistry.CommonLocators;

  public readonly _debuggerTabsContainer = ".t--debugger-tabs-container";
  public readonly _closeDebuggerButton = ".t--close-debugger";

  OpenDebugger() {
    cy.get(this.locator._debuggerIcon).click();
  }

  CloseDebugger() {
    cy.get(this._debuggerTabsContainer)
      .find(this._closeDebuggerButton)
      .click();
  }
}
