const commonlocators = require("../../../../locators/commonlocators.json");
const appNavigationLocators = require("../../../../locators/AppNavigation.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const deployMode = ObjectsRegistry.DeployMode;
let currentUrl;
describe("Validating Mobile Views for Fill Widget", function () {

  it("1. Change 'Orientation' to 'Side', sidebar should appear", () => {
    cy.get(appNavigationLocators.appSettingsButton).click();
    cy.get(appNavigationLocators.navigationSettingsTab).click();
    cy.get(
      appNavigationLocators.navigationSettings.orientationOptions.side,
    ).click({
      force: true,
    });
    cy.get(appNavigationLocators.navigationMenuItem)
      .contains("Page1")
      .click({ force: true });
  });
  it("2. Validate change with height width for fill widget - Input widget", function () {
    cy.get(commonlocators.autoConvert).click({
      force: true,
    });
    cy.get(commonlocators.convert).click({
      force: true,
    });
    cy.get(commonlocators.refreshApp).click({
      force: true,
    });
    cy.dragAndDropToCanvas("inputwidgetv2", { x: 100, y: 200 });
    cy.dragAndDropToCanvas("inputwidgetv2", { x: 10, y: 20 });
    cy.wait(1000);
    cy.url().then(url => {
    currentUrl = url;
    });
    for(let i=0;i<25;i++)
    {
    cy.CreatePage();
    cy.wait(5000);
    }
    cy.dragAndDropToCanvas("buttonwidget", { x: 10, y: 20 });
    cy.navigateOnClick("Page1","onClick");
    cy.PublishtheApp();
    cy.wait(2000);
    cy.get("button:contains('Submit')").click({force: true});
    cy.get(appNavigationLocators.navigationMenuItem)
      .contains("Page1")
      .parent()
      .parent()
      .parent()
      .parent()
      .parent()
      .should("have.class", "is-active");
    deployMode.NavigateBacktoEditor();
  })
  it("3. Navigate to widget url and validate", () => {
    cy.visit(currentUrl);
    cy.wait(1000);
    cy.get(".t--draggable-inputwidgetv2").first().should("exist");
    cy.get(".t--draggable-inputwidgetv2").last().should("exist");
    cy.get('.t--draggable-inputwidgetv2')
    .should('have.attr', 'data-testid')
    .and('equal', 't--selected');
    })
});
