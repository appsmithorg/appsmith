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
      _.agHelper.AddDsl("formInputTableV2Dsl");
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
      // validation of data displayed in input widgets based on search value set
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      _.propPane.ExpandIfCollapsedSection("search\\&filters");
      cy.get(".t--property-control-allowsearching input").click({
        force: true,
      });
      cy.testJsontext("defaultsearchtext", "2736212");
      cy.wait("@updateLayout");
      _.table.SelectTableRow(0, 0, true, "v2");
      cy.readTableV2dataPublish("0", "0").then((tabData) => {
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
