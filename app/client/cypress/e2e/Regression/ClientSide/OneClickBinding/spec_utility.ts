import OneClickBindingLocator from "../../../../locators/OneClickBindingLocator";
import * as _ from "../../../../support/Objects/ObjectsCore";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import OnboardingLocator from "../../../../locators/FirstTimeUserOnboarding.json";

export class OneClickBinding {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = OneClickBindingLocator;
  public onboardingLocator = OnboardingLocator;

  public ChooseAndAssertForm(
    source?: string,
    selectedSource?: any,
    table?: string,
    column?: string,
  ) {
    this.agHelper.GetNClick(this.locator.datasourceDropdownSelector);

    this.agHelper.AssertElementAbsence(this.locator.connectData);

    this.agHelper.GetNClick(this.locator.datasourceSelector(source));

    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    this.agHelper.Sleep(500);
    this.agHelper.AssertElementExist(this.locator.connectData);

    this.agHelper.AssertElementEnabledDisabled(this.locator.connectData);

    this.agHelper.AssertElementExist(this.locator.tableOrSpreadsheetDropdown);

    this.agHelper.GetNClick(this.locator.tableOrSpreadsheetDropdown);

    this.agHelper.GetNClick(
      `.t--one-click-binding-table-selector--table:contains(${table})`,
    );

    this.agHelper.AssertElementExist(
      `${this.locator.tableOrSpreadsheetDropdown} .rc-select-selection-item:contains(${table})`,
    );

    this.agHelper.AssertElementExist(this.locator.searchableColumn);

    this.agHelper.GetNClick(this.locator.searchableColumn);

    this.agHelper.GetNClick(
      `.t--one-click-binding-column-searchableColumn--column:contains(${column})`,
    );

    this.agHelper.AssertElementExist(
      `${this.locator.searchableColumn} .rc-select-selection-item:contains(${column})`,
    );

    this.agHelper.AssertElementExist(this.locator.connectData);

    this.agHelper.AssertElementEnabledDisabled(
      this.locator.connectData,
      0,
      false,
    );
  }
}
