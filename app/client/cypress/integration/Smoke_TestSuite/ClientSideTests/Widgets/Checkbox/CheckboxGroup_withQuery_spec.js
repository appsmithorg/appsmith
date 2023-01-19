const commonlocators = require("../../../../../locators/commonlocators.json");
const datasource = require("../../../../../locators/DatasourcesEditor.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const explorer = require("../../../../../locators/explorerlocators.json");

import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources;

const isMac = Cypress.platform === "darwin";
const selectAll = `${isMac ? "{cmd}{a}" : "{ctrl}{a}"}`;

describe("Checkbox Group Widget Functionality", function() {
  it("Check checkbox group with dynamic query", function() {
    dataSources.CreateMockDB("Users").then((mockDBName) => {
      // add Query 1 with limit 10
      dataSources.CreateQuery(mockDBName);
      agHelper.GetNClick(dataSources._templateMenuOption("Select"));
      cy.runQuery();

      // add Query 2 with limit 2
      cy.get(".t--entity-add-btn.group.files").click({ force: true });
      cy.get("span:contains('Users Query')").click({ force: true });
      agHelper.GetNClick(dataSources._templateMenuOption("Select"));
      cy.get(".CodeMirror textarea")
        .first()
        .focus()
        .type(selectAll)
        .type("select * from Users order by id limit 2");
      cy.runQuery();

      // add checkbox group widget
      cy.get(explorer.addWidget).click();
      cy.dragAndDropToCanvas("checkboxgroupwidget", { x: 300, y: 300 });
      cy.openPropertyPane("checkboxgroupwidget");

      // bind options to query data
      cy.get(".t--property-control-options")
        .find(".t--js-toggle")
        .click({ force: true });
      cy.updateCodeInput(
        ".t--property-control-options",
        `{{Query1.data.map((item) => {
          return {
            label: "Option " + item.id,
            value: item.id,
          };
        })}}`,
      );

      // update default value
      cy.updateCodeInput(
        ".t--property-control-defaultselectedvalues",
        "{{Query2.data.map((item) => item.id)}}",
      );

      cy.wait(2000);

      // deploy the app
      cy.PublishtheApp();

      cy.wait(2000);

      // checked checkbox should be 2
      cy.get(publish.checkboxGroupWidget)
        .find("input:checked")
        .should("have.length", 2);
    });
  });
});
afterEach(() => {
  // put your clean up code if any
});
