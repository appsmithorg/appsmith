const dsl = require("../../../../fixtures/emptyDSL.json");
const testdata = require("../../../../fixtures/testdata.json");
const explorer = require("../../../../locators/explorerlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");

describe("MultiSelect Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Add new dropdown widget", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("multiselectwidget", { x: 300, y: 300 });
    cy.get(".t--widget-multiselectwidget").should("exist");
  });

  it("should check that empty value is allowed in options", () => {
    cy.openPropertyPane("multiselectwidget");
    cy.updateCodeInput(
      ".t--property-control-options",
      `[
        {
          "label": "Blue",
          "value": ""
        },
        {
          "label": "Green",
          "value": "GREEN"
        },
        {
          "label": "Red",
          "value": "RED"
        }
      ]`,
    );
    cy.get(".t--property-control-options .t--codemirror-has-error").should(
      "not.exist",
    );
  });

  it("should check that more than one empty value is not allowed in options", () => {
    cy.openPropertyPane("multiselectwidget");
    cy.updateCodeInput(
      ".t--property-control-options",
      `[
        {
          "label": "Blue",
          "value": ""
        },
        {
          "label": "Green",
          "value": ""
        },
        {
          "label": "Red",
          "value": "RED"
        }
      ]`,
    );
    cy.get(".t--property-control-options .t--codemirror-has-error").should(
      "exist",
    );
  });

  it("should check that server side rendering is working", () => {
    cy.get(widgetsPage.explorerSwitchId).click({ force: true });
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("fetch_options");
    cy.enterDatasource("https://mock-api.appsmith.com/users");
    cy.wait(2000);
    cy.runQuery();
    cy.get(widgetsPage.widgetSwitchId).click({ force: true });
    cy.openPropertyPane("multiselectwidget");
    cy.updateCodeInput(
      ".t--property-control-options",
      `
        {{fetch_options.data.users.map((d) =>({
          label: d.name,
          value: d.email
        }))}}
      `,
    );
    cy.get(".t--property-control-serversidefiltering .bp3-switch").click({
      force: true,
    });
    cy.get(".t--property-control-onfilterupdate .t--js-toggle").click({
      force: true,
    });
    cy.updateCodeInput(
      ".t--property-control-onfilterupdate",
      `{{fetch_options.run()}}`,
    );
    cy.get(".t--draggable-multiselectwidget .rc-select-selector").click({
      force: true,
    });
    cy.get(".t--draggable-multiselectwidget .rc-select-selection-search-input")
      .clear()
      .type("test");
    cy.wait(700);
    cy.get(".rc-select-dropdown .cs-spinner").should("exist");
    cy.wait("@postExecute");
    cy.wait(500);
    cy.get(".rc-select-dropdown .cs-spinner").should("not.exist");
  });
});
