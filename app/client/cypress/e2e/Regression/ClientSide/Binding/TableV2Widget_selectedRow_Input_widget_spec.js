/// <reference types="Cypress" />

import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Binding the table widget and input Widget",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("formInputTableV2Dsl");
    });

    it("1. Input widget test with default value from table widget v2", function () {
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget, {}, [
        "Form1",
      ]);
      cy.testJsontext("defaultvalue", testdata.defaultInputWidget + "}}");
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
    });

    it("2. validation of data displayed in input widgets based on selected row", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      _.table.ExpandIfCollapsedSection("rowselection");
      cy.testJsontext("defaultselectedrow", "2");
      cy.readTableV2dataPublish("2", "0").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("6788734");
        cy.log("the value is" + tabValue);
        cy.get(publish.inputWidget + " " + "input")
          .first()
          .invoke("attr", "value")
          .should("contain", tabValue);
      });
    });
  },
);
