import widgetLocators from "../../../../locators/Widgets.json";
import template from "../../../../locators/TemplatesLocators.json";
import {
  agHelper,
  assertHelper,
  locators,
  templates,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

beforeEach(() => {
  // Closes template dialog if it is already open - useful for retry
  cy.get("body").then(($ele) => {
    if ($ele.find(template.templateDialogBox).length) {
      cy.xpath(template.closeButton).click({ force: true });
    }
  });
  EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
});

describe(
  "Fork a template to the current app from new page popover",
  {
    tags: [
      "@tag.Templates",
      "@tag.excludeForAirgap",
      "@tag.Sanity",
      "@tag.Git",
      "@tag.ImportExport",
      "@tag.Fork",
    ],
  },
  () => {
    it("1. Fork template from page section", () => {
      //Fork template button to be visible always
      PageList.AddNewPage("Add page from template");
      agHelper.AssertElementExist(template.templateDialogBox);
      agHelper.AssertElementVisibility(template.templateDialogBox);
      agHelper.AssertElementVisibility(templates.locators._templateCard);
      agHelper.AssertElementVisibility(template.vehicleMaintenenceApp);
      agHelper.GetNClick(template.vehicleMaintenenceApp);
      agHelper.AssertElementAbsence(
        "//*[text()='Loading template details']",
        Cypress.config().pageLoadTimeout,
      );
      agHelper.FailIfErrorToast(
        "Internal server error while processing request",
      );
      cy.get("body").then(($ele) => {
        if ($ele.find(widgetLocators.toastAction).length <= 0) {
          if ($ele.find(template.templateViewForkButton).length > 0) {
            cy.get(template.templateViewForkButton).click();
          }
        }
      });
      agHelper.AssertElementAbsence(
        locators._visibleTextSpan("Setting up the template"),
        Cypress.config().pageLoadTimeout,
      );
      agHelper.ValidateToastMessage("template added successfully");
      agHelper.AssertElementVisibility(locators._itemContainerWidget);
      agHelper.WaitUntilAllToastsDisappear();
    });

    it("2. Add selected page of template from page section", () => {
      PageList.AddNewPage("Add page from template");
      agHelper.AssertElementVisibility(template.templateDialogBox);
      agHelper.AssertElementVisibility(templates.locators._templateCard);
      agHelper.AssertElementVisibility(template.vehicleMaintenenceApp);
      agHelper.GetNClick(template.vehicleMaintenenceApp);
      agHelper.AssertElementAbsence(
        "//*[text()='Loading template details']",
        Cypress.config().pageLoadTimeout,
      );
      assertHelper.AssertNetworkStatus("getTemplatePages");
      agHelper.CheckUncheck(template.selectAllPages, false);
      agHelper.CheckUncheck(
        "div:has(> span:contains('New vehicle')) + label input[type='checkbox']",
      );
      agHelper.GetNClick(template.templateViewForkButton);
      agHelper.AssertElementAbsence(
        locators._visibleTextSpan("Setting up the template"),
        Cypress.config().pageLoadTimeout,
      );
      assertHelper.AssertNetworkStatus("fetchTemplate");
      agHelper.WaitUntilToastDisappear("template added successfully");
      agHelper.AssertElementVisibility(locators._itemContainerWidget);
    });

    it("3. Templates card should take user to 'select pages from template' page", () => {
      PageList.AddNewPage("Add page from template");
      agHelper.AssertElementVisibility(templates.locators._templateCard);
      agHelper.GetNClick(templates.locators._templateCard);
      agHelper.AssertElementVisibility(template.templateViewForkButton);
      agHelper.GetNClick(templates.locators._closeTemplateDialogBoxBtn);

      //Similar templates add icon should take user to 'select pages from template'
      //agHelper.RefreshPage();
      PageList.AddNewPage("Add page from template");
      // We are currentlyon on templates list page
      agHelper.GetNClick(templates.locators._templateCard);
      // Here we are on template detail page, with similar templates at the bottom
      agHelper.GetNClick(templates.locators._templateCard);
      agHelper.AssertElementVisibility(template.templateViewForkButton);
      agHelper.GetNClick(templates.locators._closeTemplateDialogBoxBtn);
    });

    it("4. Add page from template to show only apps with 'allowPageImport:true'", () => {
      cy.fixture("Templates/AllowPageImportTemplates.json").then((data) => {
        cy.intercept("GET", "/api/v1/app-templates", (req) =>
          req.reply({
            statusCode: 200,
            headers: {
              "x-appsmith-version": req.headers["x-appsmith-version"],
            },
            body: data,
          }),
        ).as("fetchAllTemplates");
        agHelper.RefreshPage(); //is important for intercept to go through!

        PageList.AddNewPage("Add page from template");

        agHelper.AssertElementVisibility(template.templateDialogBox);
        cy.wait("@fetchAllTemplates");
        cy.get("@fetchAllTemplates").then(({ response }) => {
          // in the fixture data we are sending some templates with `allowPageImport: false`
          cy.get(template.templateCard).should(
            "not.have.length",
            response.body.data.length,
          );

          const templatesInResponse = response.body.data.filter(
            (card) => !!card.allowPageImport,
          );
          agHelper.AssertElementLength(
            template.templateCard,
            templatesInResponse.length,
          );
          agHelper.GetNClick(templates.locators._closeTemplateDialogBoxBtn);
        });
      });
    });
  },
);
