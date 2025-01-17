const widgetsPage = require("../../../../../locators/Widgets.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
import { agHelper } from "../../../../../support/Objects/ObjectsCore";

describe(
  "Form Widget Functionality",
  { tags: ["@tag.All", "@tag.Form", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("formSelectTreeselectDsl");
    });

    it("Validate Select and TreeSelect Widget", function () {
      cy.get(widgetsPage.formButtonWidget)
        .contains("Submit")
        .should("have.attr", "disabled");
      cy.wait(1000) //for dropdown to load for CI runs
        .get(formWidgetsPage.treeSelectInput)
        .last()
        .click({ force: true })
        .wait(500);
      cy.get(formWidgetsPage.treeSelectFilterInput).click().type("Blue");
      cy.treeSelectDropdown("Blue");

      cy.get(formWidgetsPage.dropdownWidget)
        .find(widgetsPage.dropdownSingleSelect)
        .click({
          force: true,
        });
      cy.wait(2000);
      cy.get(".select-popover-wrapper").contains("Blue").click({ force: true });
      cy.wait(2000);
      cy.get(widgetsPage.formButtonWidget)
        .contains("Submit")
        .should("not.have.attr", "disabled");
    });
  },
);
