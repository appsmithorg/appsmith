import * as _ from "../../../../support/Objects/ObjectsCore";

export function ChooseAndAssertForm(source, selectedSource, table, column) {
  _.agHelper.GetNClick(".t--one-click-binding-datasource-selector");

  _.agHelper.AssertElementAbsence(
    '[data-testId="t--one-click-binding-connect-data"]',
  );

  _.agHelper.GetNClick(
    `[data-testid="t--one-click-binding-datasource-selector--datasource"]:contains(${source})`,
  );

  cy.wait("@getDatasourceStructure").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );

  _.agHelper.Sleep(500);
  _.agHelper.AssertElementExist(
    '[data-testId="t--one-click-binding-connect-data"]',
  );

  _.agHelper.AssertElementEnabledDisabled(
    '[data-testId="t--one-click-binding-connect-data"]',
  );

  _.agHelper.AssertElementExist(
    '[data-testid="t--one-click-binding-table-selector"]',
  );

  _.agHelper.GetNClick('[data-testid="t--one-click-binding-table-selector"]');

  _.agHelper.GetNClick(
    `.t--one-click-binding-table-selector--table:contains(${table})`,
  );

  _.agHelper.AssertElementExist(
    `[data-testid="t--one-click-binding-table-selector"] .rc-select-selection-item:contains(${table})`,
  );

  _.agHelper.AssertElementExist(
    '[data-testid="t--one-click-binding-column-searchableColumn"]',
  );

  _.agHelper.GetNClick(
    '[data-testid="t--one-click-binding-column-searchableColumn"]',
  );

  _.agHelper.GetNClick(
    `.t--one-click-binding-column-searchableColumn--column:contains(${column})`,
  );

  _.agHelper.AssertElementExist(
    `[data-testid="t--one-click-binding-column-searchableColumn"] .rc-select-selection-item:contains(${column})`,
  );

  _.agHelper.AssertElementExist(
    '[data-testId="t--one-click-binding-connect-data"]',
  );

  _.agHelper.AssertElementEnabledDisabled(
    '[data-testId="t--one-click-binding-connect-data"]',
    0,
    false,
  );
}
