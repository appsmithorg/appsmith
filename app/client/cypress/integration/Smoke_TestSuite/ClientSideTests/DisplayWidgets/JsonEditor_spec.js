const dsl = require("../../../../fixtures/JsonEditorDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("JSON Editor Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  // it("If defaultText is changed, it will update the corresponding value in the editor, as well", function() {
  //   cy.openPropertyPane("jsoneditorwidget");
  //   cy.testJsontext(
  //     "defaultjsonstring",
  //     JSON.stringify(this.data.jsonDefaultText),
  //   );
  //   cy.get(".jsoneditor")
  //     .contains("myname")
  //     .should("have.text", "myname");
  //   //Close edit prop
  //   cy.get(commonlocators.editPropCrossButton).click({
  //     force: true,
  //   });
  //   cy.PublishtheApp();
  // });

  it("If user change the value in view mode, it should reflect the changes in editor", function() {
    cy.PublishtheApp();
    cy.get(".json-editorvalue")
      .eq(1)
      .click()
      .type("namechanged");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.get(".jsoneditor")
      .contains("namechanged")
      .should("have.text", "namechanged");
  });
});
