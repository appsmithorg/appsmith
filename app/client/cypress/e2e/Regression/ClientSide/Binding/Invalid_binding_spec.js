import {
  agHelper,
  entityExplorer,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const testdata = require("../../../../fixtures/testdata.json");

describe(
  "Binding the multiple widgets and validating default data",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("Invalid_binding_dsl");
    });

    it("1. Dropdown widget test with invalid binding value", function () {
      EditorNavigation.SelectEntityByName("Dropdown1", EntityType.Widget);
      propPane.ToggleJSMode("sourcedata");
      cy.testJsontext(
        "sourcedata",
        JSON.stringify(testdata.defaultdataBinding),
      );
      cy.evaluateErrorMessage(testdata.dropdownErrorMsg);
      //Table widget test with invalid binding value
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      cy.testJsontext("tabledata", JSON.stringify(testdata.defaultdataBinding));
      cy.evaluateErrorMessage(
        `This value does not evaluate to type Array<Object>`,
      );
    });
  },
);
