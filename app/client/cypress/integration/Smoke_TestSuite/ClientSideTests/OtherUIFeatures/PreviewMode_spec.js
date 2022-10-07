const dsl = require("../../../../fixtures/previewMode.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");

describe("Preview mode functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("checks entity explorer and property pane visiblity", function() {
    cy.get(".t--switch-preview-mode-toggle").click();

    // in preview mode, entity explorer and property pane are not visible
    cy.get(".t--entity-explorer").should("not.be.visible");
    cy.get(".t--property-pane-sidebar").should("not.be.visible");
  });

  it("checks if widgets can be selected or not", function() {
    // in preview mode, entity explorer and property pane are not visible
    const selector = `.t--draggable-buttonwidget`;
    cy.wait(500);
    cy.get(selector)
      .first()
      .trigger("mouseover", { force: true })
      .wait(500);

    cy.get(
      `${selector}:first-of-type .t--widget-propertypane-toggle > .t--widget-name`,
    ).should("not.exist");
  });

  it("check invisible widget should not show in proview mode and should show in edit mode", function() {
    cy.get(".t--switch-comment-mode-off").click();
    cy.openPropertyPane("buttonwidget");
    cy.UncheckWidgetProperties(commonlocators.visibleCheckbox);

    // button should not show in preview mode
    cy.get(".t--switch-preview-mode-toggle").click();
    cy.get(`${publishPage.buttonWidget} button`).should("not.exist");

    // Text widget should show
    cy.get(`${publishPage.textWidget} .bp3-ui-text`).should("exist");

    // button should show in edit mode
    cy.get(".t--switch-comment-mode-off").click();
    cy.get(`${publishPage.buttonWidget} button`).should("exist");
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
