const dsl = require("../../../../../fixtures/iconButtonWidgetsDsl.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");

describe("Icon Button Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. check default buttonVariant with isJSConvertible", function() {
    cy.openPropertyPane("iconbuttonwidget");

    cy.get(formWidgetsPage.toggleButtonVariant).click();
    cy.get(widgetsPage.iconWidgetBtn).should(
      "have.css",
      "background-color",
      "rgb(3, 179, 101)",
    );
  });

  it("2. add space into buttonVariant and validate", function() {
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

    cy.get(widgetsPage.iconWidgetBtn).should(
      "have.css",
      "background-color",
      "rgb(3, 179, 101)",
    );
  });

  it("3. show alert on button click", function() {
    cy.get(".t--property-control-onclick")
      .find(".t--js-toggle")
      .click({ force: true });

    cy.testJsontext(
      "onclick",
      "{{showAlert('Icon Button Clicked','success')}}",
    );

    cy.get(widgetsPage.iconWidgetBtn).click({ force: true });
    cy.get(commonlocators.toastmsg).contains("Icon Button Clicked");
    cy.PublishtheApp();
    cy.wait(2000);
    cy.get(publishPage.iconWidgetBtn).click();
    cy.get(commonlocators.toastmsg).contains("Icon Button Clicked");
    cy.goToEditFromPublish();
  });

  it("4. should not show alert onclick if button is disabled", function() {
    cy.openPropertyPane("iconbuttonwidget");
    cy.CheckWidgetProperties(commonlocators.disableCheckbox);
    cy.get(widgetsPage.iconWidgetBtn).click({ force: true });
    cy.get(commonlocators.toastmsg).should("not.exist");
    cy.PublishtheApp();
    cy.get(publishPage.iconWidgetBtn).click({ force: true });
    cy.get(commonlocators.toastmsg).should("not.exist");
  });
});
