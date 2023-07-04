import {
  entityExplorer,
  draggableWidgets,
  autoLayout,
  homePage,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";
import template from "../../../../locators/TemplatesLocators.json";
import widgetLocators from "../../../../locators/Widgets.json";

describe("Handle Cases while conversion", () => {
  it("1. when snapshot is restored from a page created before Conversion, it should refresh in the same page", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.CONTAINER, 100, 200);

    entityExplorer.AddNewPage("New blank page");

    autoLayout.ConvertToAutoLayoutAndVerify();

    autoLayout.UseSnapshotFromBanner();

    entityExplorer.VerifyIsCurrentPage("Page2");

    entityExplorer.SelectEntityByName("Page1", "Pages");

    cy.wait(1000);

    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Page2",
    });
  });

  it("2. when snapshot is restored from a page created after Conversion, it should redirected to home page", () => {
    autoLayout.ConvertToAutoLayoutAndVerify();

    entityExplorer.AddNewPage("New blank page");

    autoLayout.UseSnapshotFromBanner();

    entityExplorer.VerifyIsCurrentPage("Page1");
  });

  it("3. #21969 - when app has null values in some widget's property actions or bindings, it should still convert without errors", () => {
    homePage.NavigateToHome();
    homePage.CreateNewApplication();

    cy.fixture("templatePageWithNullbindings").then((val) => {
      agHelper.AddDsl(val);
    });

    autoLayout.ConvertToAutoLayoutAndVerify();
  });

  it("4. when app has widgets with dynamic Bindings, which have default values that are to be defined during conversion, it should convert without errors", () => {
    homePage.NavigateToHome();
    homePage.CreateNewApplication();

    cy.fixture("conversionDslWithDynamicBindings").then((val) => {
      agHelper.AddDsl(val);
    });

    autoLayout.ConvertToAutoLayoutAndVerify();
    autoLayout.UseSnapshotFromBanner();
  });

  it(
    "excludeForAirgap",
    "5. #23367 when app imports pages from a template, it should convert without any errors before refreshing the page after load",
    () => {
      entityExplorer.AddNewPage("Add page from template");
      agHelper.AssertElementVisible(template.templateDialogBox);
      agHelper.GetNClick(template.marketingDashboard);
      cy.wait(10000); // for templates page to load fully
      agHelper.GetNClick(template.selectCheckbox);
      cy.wait(1000);
      agHelper.GetNClick(template.selectCheckbox, 1);
      agHelper.GetNClick(template.templateViewForkButton);
      cy.wait(5000);
      agHelper.AssertContains(
        "template added successfully",
        "exist",
        widgetLocators.toastAction,
      );
      autoLayout.ConvertToAutoLayoutAndVerify();
    },
  );
});
