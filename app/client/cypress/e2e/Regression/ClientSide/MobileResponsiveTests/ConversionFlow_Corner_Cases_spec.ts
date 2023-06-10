import * as _ from "../../../../support/Objects/ObjectsCore";
import template from "../../../../locators/TemplatesLocators.json";
import widgetLocators from "../../../../locators/Widgets.json";

describe("Handle Cases while conversion", () => {
  it("1. when snapshot is restored from a page created before Conversion, it should refresh in the same page", () => {
    _.entityExplorer.DragDropWidgetNVerify(
      _.draggableWidgets.CONTAINER,
      100,
      200,
    );

    _.entityExplorer.AddNewPage("New blank page");

    _.autoLayout.ConvertToAutoLayoutAndVerify();

    _.autoLayout.UseSnapshotFromBanner();

    _.entityExplorer.VerifyIsCurrentPage("Page2");

    _.entityExplorer.SelectEntityByName("Page1", "Pages");

    cy.wait(1000);

    _.entityExplorer.ActionContextMenuByEntityName("Page2");
  });

  it("2. when snapshot is restored from a page created after Conversion, it should redirected to home page", () => {
    _.autoLayout.ConvertToAutoLayoutAndVerify();

    _.entityExplorer.AddNewPage("New blank page");

    _.autoLayout.UseSnapshotFromBanner();

    _.entityExplorer.VerifyIsCurrentPage("Page1");
  });

  it("3. #21969 - when app has null values in some widget's property actions or bindings, it should still convert without errors", () => {
    _.homePage.NavigateToHome();
    _.homePage.CreateNewApplication();

    cy.fixture("templatePageWithNullbindings").then((val) => {
      _.agHelper.AddDsl(val);
    });

    _.autoLayout.ConvertToAutoLayoutAndVerify();
  });

  it("4. when app has widgets with dynamic Bindings, which have default values that are to be defined during conversion, it should convert without errors", () => {
    _.homePage.NavigateToHome();
    _.homePage.CreateNewApplication();

    cy.fixture("conversionDslWithDynamicBindings").then((val) => {
      _.agHelper.AddDsl(val);
    });

    _.autoLayout.ConvertToAutoLayoutAndVerify();
    _.autoLayout.UseSnapshotFromBanner();
  });

  it("5. #23367 when app imports pages from a template, it should convert without any errors before refreshing the page after load", () => {
    _.entityExplorer.AddNewPage("Add page from template");
    _.agHelper.AssertElementVisible(template.templateDialogBox);
    _.agHelper.GetNClick("//h1[text()='Marketing Dashboard']");
    cy.wait(10000); // for templates page to load fully
    _.agHelper.GetNClick(template.selectCheckbox);
    cy.wait(1000);
    _.agHelper.GetNClick(template.selectCheckbox, 1);
    _.agHelper.GetNClick(template.templateViewForkButton);
    cy.wait(5000);
    _.agHelper.AssertContains(
      "template added successfully",
      "exist",
      widgetLocators.toastAction,
    );

    _.autoLayout.ConvertToAutoLayoutAndVerify();
  });
});
