/* eslint-disable cypress/no-unnecessary-waiting */
import {
  entityExplorer,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Table Widget condtional formatting to remain consistent",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("tableWidgetCondnFormatDsl");
    });

    it("check the cell styles before and after sorting", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      //Check Font weight, font style, and text color before sorting
      cy.readTabledataValidateCSS("0", "1", "font-weight", "700");
      cy.readTabledataValidateCSS("0", "1", "font-style", "normal");
      cy.readTabledataValidateCSS("0", "1", "color", "rgb(0, 0, 255)");

      cy.readTabledataValidateCSS("1", "1", "font-weight", "400");
      cy.readTabledataValidateCSS("1", "1", "font-style", "italic");
      cy.readTabledataValidateCSS("1", "1", "color", "rgb(255, 0, 0)");

      cy.get(".draggable-header").contains("id").click({ force: true });

      //Check Font weight, font style, and text color after sorting
      cy.readTabledataValidateCSS("3", "1", "font-weight", "700");
      cy.readTabledataValidateCSS("3", "1", "font-style", "normal");
      cy.readTabledataValidateCSS("3", "1", "color", "rgb(0, 0, 255)");

      cy.readTabledataValidateCSS("2", "1", "font-weight", "400");
      cy.readTabledataValidateCSS("2", "1", "font-style", "italic");
      cy.readTabledataValidateCSS("2", "1", "color", "rgb(255, 0, 0)");
    });
  },
);
