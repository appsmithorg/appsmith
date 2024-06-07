import {
  entityExplorer,
  draggableWidgets,
  autoLayout,
  homePage,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";
import template from "../../../../locators/TemplatesLocators.json";
import widgetLocators from "../../../../locators/Widgets.json";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";
import { EntityItems } from "../../../../support/Pages/AssertHelper";

describe(
  "Handle Cases while conversion",
  { tags: ["@tag.MobileResponsive"] },
  () => {
    it("1. when snapshot is restored from a page created before Conversion, it should refresh in the same page", () => {
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.CONTAINER,
        100,
        200,
      );

      PageList.AddNewPage("New blank page");

      autoLayout.ConvertToAutoLayoutAndVerify();

      autoLayout.UseSnapshotFromBanner();

      PageList.VerifyIsCurrentPage("Page2");

      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      cy.wait(1000);

      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Page2",
        entityType: EntityItems.Page,
      });
    });

    it("2. when snapshot is restored from a page created after Conversion, it should redirected to home page", () => {
      autoLayout.ConvertToAutoLayoutAndVerify();

      PageList.AddNewPage("New blank page");

      autoLayout.UseSnapshotFromBanner();

      PageList.VerifyIsCurrentPage("Page1");
    });

    it("3. #21969 - when app has null values in some widget's property actions or bindings, it should still convert without errors", () => {
      homePage.NavigateToHome();
      homePage.CreateNewApplication();

      agHelper.AddDsl("templatePageWithNullbindings");

      autoLayout.ConvertToAutoLayoutAndVerify();
    });

    it("4. when app has widgets with dynamic Bindings, which have default values that are to be defined during conversion, it should convert without errors", () => {
      homePage.NavigateToHome();
      homePage.CreateNewApplication();

      agHelper.AddDsl("conversionDslWithDynamicBindings");

      autoLayout.ConvertToAutoLayoutAndVerify();
      autoLayout.UseSnapshotFromBanner();
    });

    it(
      "5. #23367 when app imports pages from a template, it should convert without any errors before refreshing the page after load",
      { tags: ["@tag.excludeForAirgap"] },
      () => {
        PageList.AddNewPage("Add page from template");
        agHelper.AssertElementVisibility(template.templateDialogBox);
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
  },
);
