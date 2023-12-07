import widgetLocators from "../../../../locators/Widgets.json";
import template from "../../../../locators/TemplatesLocators.json";
import { agHelper, templates } from "../../../../support/Objects/ObjectsCore";
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
  "excludeForAirgap",
  "Fork a template to the current app from new page popover",
  () => {
    it("1. Fork template from page section", () => {
      //Fork template button to be visible always
      PageList.AddNewPage("Add page from template");
      agHelper.Sleep(5000);
      agHelper.AssertElementExist(template.templateDialogBox);
      agHelper.AssertElementVisibility(templates.locators._templateCard);
      agHelper.Sleep(4000);
      agHelper.GetNClick(template.vehicleMaintenenceApp);
      agHelper.WaitUntilEleDisappear("//*[text()='Loading template details']");
      agHelper.Sleep();
      agHelper.CheckForErrorToast(
        "Internal server error while processing request",
      );
      cy.get("body").then(($ele) => {
        if ($ele.find(widgetLocators.toastAction).length <= 0) {
          if ($ele.find(template.templateViewForkButton).length > 0) {
            cy.get(template.templateViewForkButton).click();
          }
        }
      });
      cy.get(widgetLocators.toastAction).should(
        "contain",
        "template added successfully",
      );
    });

    it("2. Add selected page of template from page section", () => {
      PageList.AddNewPage("Add page from template");
      agHelper.AssertElementVisibility(template.templateDialogBox);
      agHelper.AssertElementVisibility(
        templates.locators._templateCard,
        true,
        0,
        30000,
      );
      agHelper.GetNClick(template.vehicleMaintenenceApp);
      //agHelper.WaitUntilEleDisappear("//*[text()='Loading template details']");
      cy.wait("@getTemplatePages").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );

      //cy.xpath(template.selectAllPages).next().click();
      // cy.xpath("//span[text()='CALENDAR MOBILE']").parent().next().click();
      agHelper.GetNClick(template.templateViewForkButton);
      cy.wait("@fetchTemplate").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      agHelper.GetNAssertElementText(
        widgetLocators.toastAction,
        "template added successfully",
        "contain.text",
      );
    });

    it("3. Templates card should take user to 'select pages from template' page", () => {
      //agHelper.RefreshPage();

      PageList.AddNewPage("Add page from template");
      agHelper.AssertElementVisibility(
        templates.locators._templateCard,
        true,
        0,
        30000,
      );
      agHelper.GetNClick(templates.locators._templateCard);
      agHelper.Sleep(2000);
      agHelper.AssertElementVisibility(template.templateViewForkButton);
      agHelper.Sleep(2000);
      agHelper.GetNClick(templates.locators._closeTemplateDialogBoxBtn);
      agHelper.Sleep();

      //Similar templates add icon should take user to 'select pages from template'
      //agHelper.RefreshPage();
      PageList.AddNewPage("Add page from template");
      // We are currentlyon on templates list page
      agHelper.GetNClick(templates.locators._templateCard);
      // Here we are on template detail page, with similar templates at the bottom
      agHelper.GetNClick(templates.locators._templateCard);
      agHelper.Sleep(2000);
      agHelper.AssertElementVisibility(template.templateViewForkButton);
      agHelper.Sleep(2000);
      agHelper.GetNClick(templates.locators._closeTemplateDialogBoxBtn);
    });

    it("4. Add page from template to show only apps with 'allowPageImport:true'", () => {
      cy.fixture("Templates/AllowPageImportTemplates.json").then((data) => {
        cy.intercept(
          {
            method: "GET",
            url: "/api/v1/app-templates",
          },
          {
            statusCode: 200,
            body: data,
          },
        ).as("fetchAllTemplates");
        agHelper.RefreshPage(); //is important for intercept to go thru!

        PageList.AddNewPage("Add page from template");

        agHelper.AssertElementVisibility(template.templateDialogBox);
        cy.wait("@fetchAllTemplates");
        cy.get("@fetchAllTemplates").then(({ request, response }) => {
          // in the fixture data we are sending some tempaltes with `allowPageImport: false`
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
