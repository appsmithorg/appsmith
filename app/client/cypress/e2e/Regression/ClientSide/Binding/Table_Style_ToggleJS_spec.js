/* eslint-disable cypress/no-unnecessary-waiting */

import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../locators/Widgets.json");
const testdata = require("../../../../fixtures/testdata.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget property pane feature validation",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tableNewDsl");
    });

    it("1. Table widget toggle test for text alignment", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      cy.editColumn("id");
      //cy.movetoStyleTab();
      _.agHelper.Sleep();
      _.propPane.EnterJSContext("Text align", testdata.bindingAlign);
      cy.readTabledataValidateCSS("0", "0", "justify-content", "flex-start");
      cy.readTabledataValidateCSS("1", "0", "justify-content", "flex-end");
    });

    it("2. Table widget change text size and validate", function () {
      cy.readTabledataValidateCSS("0", "0", "font-size", "14px");
      //cy.movetoStyleTab();
      cy.get(widgetsPage.textSize).last().click({ force: true });
      _.agHelper.Sleep();
      cy.selectTxtSize("XL");
      cy.readTabledataValidateCSS("0", "0", "font-size", "30px");
    });

    it("3. Table widget toggle test for vertical Alignment", function () {
      //cy.movetoStyleTab();
      _.agHelper.Sleep();
      _.propPane.EnterJSContext(
        "Vertical alignment",
        testdata.bindingVerticalAlig,
      );
      cy.readTabledataValidateCSS("0", "0", "align-items", "flex-start");
      cy.readTabledataValidateCSS("1", "0", "align-items", "flex-end");
    });

    it("4. Table widget toggle test for text size", function () {
      //cy.movetoStyleTab();
      _.agHelper.Sleep();
      _.propPane.EnterJSContext("Text size", testdata.bindingSize);
      cy.wait(2000);
      cy.readTabledataValidateCSS("0", "0", "font-size", "14px");
      cy.readTabledataValidateCSS("1", "0", "font-size", "24px");
    });

    it("5. Table widget toggle test for style Alignment", function () {
      //cy.movetoStyleTab();
      _.agHelper.Sleep();
      _.propPane.EnterJSContext("Font Style", testdata.bindingStyle);
      cy.readTabledataValidateCSS("0", "0", "font-style", "normal");
      cy.readTabledataValidateCSS("1", "0", "font-style", "italic");
    });

    it("6. Table widget toggle test for text color", function () {
      //cy.movetoStyleTab();
      _.agHelper.Sleep();
      _.propPane.EnterJSContext("Text color", testdata.bindingTextColor);
      cy.readTabledataValidateCSS("0", "0", "color", "rgb(0, 128, 0)");
      cy.readTabledataValidateCSS("1", "0", "color", "rgb(255, 0, 0)");
    });

    it("7. Table widget toggle test for background color", function () {
      //cy.movetoStyleTab();
      _.agHelper.Sleep();
      _.propPane.EnterJSContext("Cell Background", testdata.bindingTextColor);
      cy.readTabledataValidateCSS(
        "0",
        "0",
        "background",
        "rgb(0, 128, 0) none repeat scroll 0% 0% / auto padding-box border-box",
      );
      cy.readTabledataValidateCSS(
        "1",
        "0",
        "background",
        "rgb(255, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box",
      );
    });
  },
);
