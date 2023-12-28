import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Binding the Table and input Widget",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("formInputTableDsl");
    });

    it("1. Input widget test with default value from table widget", function () {
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget, {}, [
        "Form1",
      ]);
      cy.testJsontext("defaultvalue", testdata.defaultInputWidget + "}}");

      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      //validation of data displayed in input widgets based on search value set
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      cy.testJsontext("defaultsearchtext", "2736212");

      cy.wait("@updateLayout").isSelectRow(0);
      cy.readTabledataPublish("0", "0").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("2736212");
        cy.log("the value is" + tabValue);
        cy.get(publish.inputWidget + " " + "input")
          .first()
          .invoke("attr", "value")
          .should("contain", tabValue);
      });
    });
  },
);
