const explorer = require("../../../../locators/explorerlocators.json");
const jsEditorLocators = require("../../../../locators/JSEditor.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/formInputTableDsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");

const pageid = "Page1";

describe("Binding the Widgets with JSObject", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Bind Input widget test with JSObject", function() {
    cy.createJSObject('return "Success";');
    cy.SearchEntityandOpen("Input2");
    cy.testJsontext("defaulttext", "{{JSObject1.run()}}");
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
