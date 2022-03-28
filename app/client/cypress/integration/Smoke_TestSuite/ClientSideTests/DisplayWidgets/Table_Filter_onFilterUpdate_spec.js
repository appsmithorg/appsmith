const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tableWidgetDsl.json");

describe("Table Widget Filter Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Table Widget Functionality", function() {
    cy.openPropertyPane("tablewidget");
    cy.widgetText("Table1", widgetsPage.tableWidget, commonlocators.tableInner);
    cy.testJsontext("tabledata", JSON.stringify(this.data.TableInput));
    cy.wait("@updateLayout");
  });

  it("onFilterUpdate: it should be triggered when the table filters are changed", function() {
    // cy.get(publish.backToEditor).click();
    cy.wait(2000);
    cy.openPropertyPane("tablewidget");
    // Set the onFilterUpdate action
    cy.get(".t--property-control-onfilterupdate .t--js-toggle")
      .first()
      .click();
    cy.testJsontext("onfilterupdate", "{{showAlert('changed', 'success')}}");
    cy.wait("@updateLayout");
    // Change the table filter
    cy.get(publish.filterBtn).click();
    cy.get(publish.attributeDropdown).click();
    cy.get(publish.attributeValue)
      .contains("productName")
      .click();
    cy.get(publish.conditionDropdown).click();
    cy.get(publish.attributeValue)
      .contains("contains")
      .click();
    cy.get(publish.inputValue).type("Chicken Sandwich");
    cy.get(widgetsPage.filterApplyBtn).click();
    // Check if the action is triggered
    cy.get(commonlocators.toastmsg).contains("changed");
  });

  it("onFilterUpdate: it should be triggered when the table filters are reset", function() {
    cy.openPropertyPane("tablewidget");
    // Set the onFilterUpdate action
    cy.get(".t--property-control-onfilterupdate .CodeMirror textarea")
      .first()
      .focus()
      .type("{home}")
      .type("{upArrow}")
      .type("{ctrl}{shift}{end}")
      .clear();
    cy.testJsontext("onfilterupdate", "{{showAlert('reset', 'success')}}");
    cy.wait("@updateLayout");
    // Clear all filters
    cy.get(publish.filterBtn).click();
    cy.get(".t--clear-all-filter-btn").click();
    // Check if the action is triggered
    cy.get(commonlocators.toastmsg).contains("reset");
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
