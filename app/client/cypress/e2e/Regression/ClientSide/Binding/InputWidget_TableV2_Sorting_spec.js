import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");
import { agHelper, propPane } from "../../../../support/Objects/ObjectsCore";

describe(
  "Binding the Table and input Widget",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("formInputTableV2Dsl");
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
    });

    it("2. validation of data displayed in input widgets based on sorting", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.ExpandIfCollapsedSection("rowselection");
      cy.testJsontext("defaultselectedrow", "0");
      cy.get(".draggable-header").contains("id").click({ force: true });
      cy.get(".tbody").should("be.visible");
      cy.readTableV2dataPublish("0", "0").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("6788734");
        cy.log("the value is" + tabValue);
        cy.get(publish.inputWidget + " " + "input")
          .first()
          .invoke("attr", "value")
          .should("contain", tabValue);
      });
      cy.get(".draggable-header").contains("id").click({ force: true });
      cy.get(".tbody").should("be.visible");
      cy.readTableV2dataPublish("0", "0").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("2381224");
        cy.log("the value is" + tabValue);
        cy.get(publish.inputWidget + " " + "input")
          .first()
          .invoke("attr", "value")
          .should("contain", tabValue);
      });
    });

    it("3. validation of column id displayed in input widgets based on sorted column", function () {
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);

      cy.testJsontext("defaultvalue", testdata.sortedColumn + "}}");
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", "id");
    });
  },
);
