import * as _ from "../../../../support/Objects/ObjectsCore";
import oneClickBindingLocator from "../../../../locators/OneClickBindingLocator";

export class OneClickBinding {
  public ChooseAndAssertForm(
    source?: string,
    selectedSource?: any,
    table?: string,
    column?: string,
  ) {
    _.agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

    _.agHelper.AssertElementAbsence(oneClickBindingLocator.connectData);

    _.agHelper.GetNClick(oneClickBindingLocator.datasourceSelector(source));

    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    _.agHelper.Sleep(500);
    _.agHelper.AssertElementExist(oneClickBindingLocator.connectData);

    _.agHelper.AssertElementEnabledDisabled(oneClickBindingLocator.connectData);

    _.agHelper.AssertElementExist(
      oneClickBindingLocator.tableOrSpreadsheetDropdown,
    );

    _.agHelper.GetNClick(oneClickBindingLocator.tableOrSpreadsheetDropdown);

    _.agHelper.GetNClick(
      `.t--one-click-binding-table-selector--table:contains(${table})`,
    );

    _.agHelper.AssertElementExist(
      `${oneClickBindingLocator.tableOrSpreadsheetDropdown} .rc-select-selection-item:contains(${table})`,
    );

    _.agHelper.AssertElementExist(oneClickBindingLocator.searchableColumn);

    _.agHelper.GetNClick(oneClickBindingLocator.searchableColumn);

    _.agHelper.GetNClick(
      `.t--one-click-binding-column-searchableColumn--column:contains(${column})`,
    );

    _.agHelper.AssertElementExist(
      `${oneClickBindingLocator.searchableColumn} .rc-select-selection-item:contains(${column})`,
    );

    _.agHelper.AssertElementExist(oneClickBindingLocator.connectData);

    _.agHelper.AssertElementEnabledDisabled(
      oneClickBindingLocator.connectData,
      0,
      false,
    );
  }
}
