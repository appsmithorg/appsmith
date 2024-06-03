import widgetLocators from "../../../../locators/Widgets.json";
import template from "../../../../locators/TemplatesLocators.json";
import {
  agHelper,
  locators,
  templates,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

beforeEach(() => {
  cy.get("body").then(($ele) => {
    if ($ele.find(template.templateDialogBox).length) {
      cy.xpath(template.closeButton).click({ force: true });
    }
  });
  EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
});

describe(
  "Fork a template to the current aplication using Redux store",
  { tags: ["@tag.Templates", "@tag.excludeForAirgap"] },
  () => {
    it("Fork template from page section", () => {

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

      const vehicleMaintenenceAppTemplateId=defaultAppState.ui.templates.templates[4].id
      const endpoint = `/api/v1/app-templates/${vehicleMaintenenceAppTemplateId}`;
      cy.intercept('GET', endpoint).as('fetchTemplateDetails');
      cy.get('@fetchTemplateDetails.all').should('have.length', 0);
    });
  },
);
