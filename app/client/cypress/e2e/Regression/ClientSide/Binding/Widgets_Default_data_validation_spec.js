import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");
import {
  entityExplorer,
  agHelper,
  propPane,
  table,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Binding the multiple widgets and validating default data",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("MultipleWidgetDsl");
    });

    it("1. Input widget test with default value from table widget", function () {
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Default value",
        testdata.defaultInputWidget + "}}",
      );
      //Dropdown widget test with default value from table widget
      EditorNavigation.SelectEntityByName("Dropdown1", EntityType.Widget);
      propPane.ToggleJSMode("sourcedata");
      cy.testJsontext(
        "sourcedata",
        JSON.stringify(testdata.deafultDropDownWidget),
      );
    });

    it("2. validation of default data displayed in all widgets based on row selected", function () {
      table.SelectTableRow(1);
      cy.readTabledataPublish("1", "0").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("2736212");
        cy.log("the value is" + tabValue);

        cy.get(publish.inputWidget + " " + "input")
          .first()
          .invoke("attr", "value")
          .should("contain", tabValue);
      });

      cy.readTabledataPublish("1", "1").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("lindsay.ferguson@reqres.in");
        cy.log("the value is" + tabValue);
        cy.get(widgetsPage.defaultSingleSelectValue)
          .first()
          .invoke("text")
          .then((text) => {
            const someText = text;
            expect(someText).to.equal(tabValue);
          });
      });
    });
  },
);
