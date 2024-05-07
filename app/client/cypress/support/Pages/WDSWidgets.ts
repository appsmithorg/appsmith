import { ObjectsRegistry } from "../Objects/Registry";

export class WDSWidgets {
  private locator = ObjectsRegistry.CommonLocators;

  public _switchWidgetTargetSelector = (name: string) =>
    `${this.locator._widgetByName(name)} label`;
  public _checkboxWidgetTargetSelector = this._switchWidgetTargetSelector;

  public verifySwitchWidgetState = (
    name: string,
    expectedState: "checked" | "unchecked",
  ) => {
    const switchLabelSelector = `${this.locator._widgetByName(name)} label`;
    cy.get(switchLabelSelector).should(
      "have.attr",
      "data-state",
      expectedState,
    );
  };
  public verifyCheckboxWidgetState = this.verifySwitchWidgetState;
}
