const dsl = require("../../../../fixtures/iconButtonWidgetsDsl.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");

describe("Icon Button Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("check default buttonVariant with isJSConvertible", function() {
    cy.openPropertyPane("iconbuttonwidget");

    cy.get(formWidgetsPage.toggleButtonVariant).click();
    cy.get(".t--draggable-iconbuttonwidget button").should(
      "have.css",
      "background-color",
      "rgb(3, 179, 101)",
    );
  });

  it("add space into buttonVariant and validate", function() {
    cy.get(".t--property-control-buttonvariant .CodeMirror  textarea")
      .first()
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .then(($cm) => {
        if ($cm.val() !== "") {
          cy.get(".t--property-control-buttonvariant .CodeMirror textarea")
            .first()
            .clear({
              force: true,
            });
        }
      });
    cy.get(".t--property-control-buttonvariant .CodeMirror-code").type(
      "PRIMARY   ",
    );

    cy.get(".t--draggable-iconbuttonwidget button").should(
      "have.css",
      "background-color",
      "rgb(3, 179, 101)",
    );
  });
});
