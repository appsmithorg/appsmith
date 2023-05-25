import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import template from "../../../../locators/TemplatesLocators.json";
import widgetLocators from "../../../../locators/Widgets.json";

const templatePageWithNullBindings = require("../../../../fixtures/templatePageWithNullbindings.json");
const conversionDslWithDynamicBindings = require("../../../../fixtures/conversionDslWithDynamicBindings.json");

const autoLayout = ObjectsRegistry.AutoLayout,
  home = ObjectsRegistry.HomePage,
  ee = ObjectsRegistry.EntityExplorer;

describe("Handle Cases while conversion", () => {
  it("1. when snapshot is restored from a page created before Conversion, it should refresh in the same page", () => {
    cy.dragAndDropToCanvas("containerwidget", { x: 100, y: 200 });

    cy.CreatePage();
    cy.wait("@createPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    autoLayout.convertToAutoLayoutAndVerify();

    autoLayout.useSnapshotFromBanner();

    ee.verifyIsCurrentPage("Page2");

    ee.SelectEntityByName("Page1", "Pages");

    cy.wait(1000);

    cy.Deletepage("Page2");
  });

  it("2. when snapshot is restored from a page created after Conversion, it should redirected to home page", () => {
    autoLayout.convertToAutoLayoutAndVerify();

    cy.CreatePage();
    cy.wait("@createPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    autoLayout.useSnapshotFromBanner();

    ee.verifyIsCurrentPage("Page1");
  });

  it("3. #21969 - when app has null values in some widget's property actions or bindings, it should still convert without errors", () => {
    home.NavigateToHome();
    home.CreateNewApplication();

    cy.addDsl(templatePageWithNullBindings);

    autoLayout.convertToAutoLayoutAndVerify();
  });

  it("4. when app has widgets with dynamic Bindings, which have default values that are to be defined during conversion, it should convert without errors", () => {
    home.NavigateToHome();
    home.CreateNewApplication();

    cy.addDsl(conversionDslWithDynamicBindings);

    autoLayout.convertToAutoLayoutAndVerify();
    autoLayout.useSnapshotFromBanner();
  });

  it("5. #23367 when app imports pages from a template, it should convert without any errors before refreshing the page after load", () => {
    ee.AddNewPage("Add page from template");
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

    autoLayout.convertToAutoLayoutAndVerify();
  });
});
