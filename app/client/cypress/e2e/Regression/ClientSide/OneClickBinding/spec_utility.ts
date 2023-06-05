import OneClickBindingLocator from "../../../../locators/OneClickBindingLocator";
import * as _ from "../../../../support/Objects/ObjectsCore";
import OnboardingLocator from "../../../../locators/FirstTimeUserOnboarding.json";

export class OneClickBinding {
  public locator = OneClickBindingLocator;
  public onboardingLocator = OnboardingLocator;

  public ChooseAndAssertForm(
    source?: string,
    selectedSource?: any,
    table?: string,
    column?: string,
  ) {
    _.agHelper.GetNClick(this.locator.datasourceDropdownSelector);

    _.agHelper.AssertElementAbsence(this.locator.connectData);

    _.agHelper.GetNClick(this.locator.datasourceSelector(source));

    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    _.agHelper.Sleep(500);
    _.agHelper.AssertElementExist(this.locator.connectData);

    _.agHelper.AssertElementEnabledDisabled(this.locator.connectData);

    _.agHelper.AssertElementExist(this.locator.tableOrSpreadsheetDropdown);

    _.agHelper.GetNClick(this.locator.tableOrSpreadsheetDropdown);

    _.agHelper.GetNClick(
      `.t--one-click-binding-table-selector--table:contains(${table})`,
    );

    _.agHelper.AssertElementExist(
      `${this.locator.tableOrSpreadsheetDropdown} .rc-select-selection-item:contains(${table})`,
    );

    _.agHelper.AssertElementExist(this.locator.searchableColumn);

    _.agHelper.GetNClick(this.locator.searchableColumn);

    _.agHelper.GetNClick(
      `.t--one-click-binding-column-searchableColumn--column:contains(${column})`,
    );

    _.agHelper.AssertElementExist(
      `${this.locator.searchableColumn} .rc-select-selection-item:contains(${column})`,
    );

    _.agHelper.AssertElementExist(this.locator.connectData);

    _.agHelper.AssertElementEnabledDisabled(this.locator.connectData, 0, false);
  }
}
