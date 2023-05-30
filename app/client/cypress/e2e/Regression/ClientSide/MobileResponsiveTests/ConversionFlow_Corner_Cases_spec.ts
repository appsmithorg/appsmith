import * as _ from "../../../../support/Objects/ObjectsCore";
import template from "../../../../locators/TemplatesLocators.json";
import widgetLocators from "../../../../locators/Widgets.json";

const templatePageWithNullBindings = require("../../../../fixtures/templatePageWithNullbindings.json");
const conversionDslWithDynamicBindings = require("../../../../fixtures/conversionDslWithDynamicBindings.json");

describe("Handle Cases while conversion", () => {
  it("1. when snapshot is restored from a page created before Conversion, it should refresh in the same page", () => {
    _.entityExplorer.DragDropWidgetNVerify("containerwidget", 100, 200);

    _.entityExplorer.AddNewPage("New blank page");

    _.autoLayout.convertToAutoLayoutAndVerify();

    _.autoLayout.useSnapshotFromBanner();

    _.entityExplorer.verifyIsCurrentPage("Page2");

    _.entityExplorer.SelectEntityByName("Page1", "Pages");

    cy.wait(1000);

    _.entityExplorer.ActionContextMenuByEntityName("Page2");
  });

  it("2. when snapshot is restored from a page created after Conversion, it should redirected to home page", () => {
    _.autoLayout.convertToAutoLayoutAndVerify();

    _.entityExplorer.AddNewPage("New blank page");

    _.autoLayout.useSnapshotFromBanner();

    _.entityExplorer.verifyIsCurrentPage("Page1");
  });

  it("3. #21969 - when app has null values in some widget's property actions or bindings, it should still convert without errors", () => {
    _.homePage.NavigateToHome();
    _.homePage.CreateNewApplication();

    cy.addDsl(templatePageWithNullBindings);

    _.autoLayout.convertToAutoLayoutAndVerify();
  });

  it("4. when app has widgets with dynamic Bindings, which have default values that are to be defined during conversion, it should convert without errors", () => {
    _.homePage.NavigateToHome();
    _.homePage.CreateNewApplication();

    cy.addDsl(conversionDslWithDynamicBindings);

    _.autoLayout.convertToAutoLayoutAndVerify();
    _.autoLayout.useSnapshotFromBanner();
  });

  it("5. #23367 when app imports pages from a template, it should convert without any errors before refreshing the page after load", () => {
    _.entityExplorer.AddNewPage("Add page from template");
    cy.get(template.templateDialogBox).should("be.visible");
    cy.xpath("//h1[text()='Marketing Dashboard']").click();
    cy.wait(10000); // for templates page to load fully
    cy.get(template.selectCheckbox).first().click();
    cy.wait(1000);
    cy.get(template.selectCheckbox).eq(1).click();
    cy.get(template.templateViewForkButton).click();
    cy.wait(5000);
    cy.get(widgetLocators.toastAction, { timeout: 40000 }).should(
      "contain",
      "template added successfully",
    );

    _.autoLayout.convertToAutoLayoutAndVerify();
  });
});
