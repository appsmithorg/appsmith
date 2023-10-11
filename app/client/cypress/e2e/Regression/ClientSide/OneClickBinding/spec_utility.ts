import {
  agHelper,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";
import oneClickBindingLocator from "../../../../locators/OneClickBindingLocator";

export class OneClickBinding {
  public ChooseAndAssertForm(
    source?: string,
    selectedSource?: any,
    table?: string,
    column: Record<string, string> = {},
  ) {
    agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

    expandLoadMoreOptions();

    agHelper.AssertElementAbsence(oneClickBindingLocator.connectData);

    agHelper.GetNClick(oneClickBindingLocator.datasourceSelector(source));

    assertHelper.AssertNetworkStatus("@getDatasourceStructure");

    agHelper.AssertElementExist(oneClickBindingLocator.connectData);

    agHelper.AssertElementEnabledDisabled(oneClickBindingLocator.connectData);
    agHelper.Sleep(3000); //for tables to populate for CI runs

    agHelper.GetNClick(oneClickBindingLocator.tableOrSpreadsheetDropdown);

    agHelper.GetNClick(
      oneClickBindingLocator.tableOrSpreadsheetDropdownOption(table),
    );

    agHelper.AssertElementExist(
      oneClickBindingLocator.tableOrSpreadsheetSelectedOption(table),
    );

    Object.entries(column).forEach(([key, value]) => {
      agHelper.AssertElementExist((oneClickBindingLocator as any)[key]);

      agHelper.GetNClick((oneClickBindingLocator as any)[key]);

      agHelper.GetNClick(
        oneClickBindingLocator.columnDropdownOption(key, value),
      );

      agHelper.AssertElementExist(
        oneClickBindingLocator.columnSelectedOption(key, value),
      );
    });

    agHelper.AssertElementExist(oneClickBindingLocator.connectData);

    agHelper.AssertElementEnabledDisabled(
      oneClickBindingLocator.connectData,
      0,
      false,
    );
  }
}

export function expandLoadMoreOptions() {
  cy.get("body").then(($ele) => {
    if ($ele.find(oneClickBindingLocator.loadMore).length > 0) {
      const length = $ele.find(oneClickBindingLocator.loadMore).length;
      new Array(length).fill(" ").forEach((d, i) => {
        agHelper.GetNClick(oneClickBindingLocator.loadMore, 0);
      });
    }
  });
}
