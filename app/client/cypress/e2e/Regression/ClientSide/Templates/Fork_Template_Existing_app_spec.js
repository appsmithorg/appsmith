import widgetLocators from "../../../../locators/Widgets.json";
import template from "../../../../locators/TemplatesLocators.json";
import * as _ from "../../../../support/Objects/ObjectsCore";

beforeEach(() => {
  // Closes template dialog if it is already open - useful for retry
  cy.get("body").then(($ele) => {
    if ($ele.find(template.templateDialogBox).length) {
      cy.xpath(template.closeButton).click({ force: true });
    }
  });
  cy.CheckAndUnfoldEntityItem("Pages");
  cy.get(`.t--entity-name:contains(Page1)`)
    .trigger("mouseover")
    .click({ force: true });
});

describe(
  "excludeForAirgap",
  "Fork a template to the current app from new page popover",
  () => {
    it("1. Fork template from page section", () => {
      //Fork template button to be visible always
      _.entityExplorer.AddNewPage("Add page from template");
      cy.wait(5000);
      _.agHelper.AssertElementExist(_.templates.locators._forkApp);
      cy.get(template.templateDialogBox).should("be.visible");
      cy.wait(4000);
      cy.xpath(
        "//h1[text()='Meeting Scheduler']/parent::div//button[contains(@class, 't--fork-template')]",
      )
        .scrollIntoView()
        .wait(500)
        .click();
      _.agHelper.WaitUntilEleDisappear(
        "//*[text()='Loading template details']",
      );
      cy.wait(1000);
      _.agHelper.CheckForErrorToast(
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
      _.entityExplorer.AddNewPage("Add page from template");
      cy.get(template.templateDialogBox).should("be.visible");
      cy.wait(4000);
      cy.xpath("//h1[text()='Meeting Scheduler']").click();
      _.agHelper.WaitUntilEleDisappear(
        "//*[text()='Loading template details']",
      );
      cy.wait("@getTemplatePages").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );

      //cy.xpath(template.selectAllPages).next().click();
      // cy.xpath("//span[text()='CALENDAR MOBILE']").parent().next().click();
      cy.get(template.templateViewForkButton).click();
      cy.wait("@fetchTemplate").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.get(widgetLocators.toastAction).should(
        "contain",
        "template added successfully",
      );
    });

    it("3. Fork template button should take user to 'select pages from template' page", () => {
      _.agHelper.RefreshPage();
      _.entityExplorer.AddNewPage("Add page from template");
      cy.get(_.templates.locators._forkApp).first().click();
      cy.get(template.templateViewForkButton).should("be.visible");
      //Similar templates add icon should take user to 'select pages from template'
      _.agHelper.RefreshPage();
      _.entityExplorer.AddNewPage("Add page from template");
      // We are currentlyon on templates list page
      cy.get(_.templates.locators._forkApp).first().click();
      // Here we are on template detail page, with similar templates at the bottom
      cy.get(_.templates.locators._forkApp).first().click();

      cy.get(template.templateViewForkButton).should("be.visible");
      cy.get(_.templates.locators._closeTemplateDialogBoxBtn).click();
    });

    it("4. Add page from template to show only apps with 'allowPageImport:true'", () => {
      _.agHelper.RefreshPage(); //is important for below intercept to go thru!
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

        _.entityExplorer.AddNewPage("Add page from template");

        cy.get(template.templateDialogBox).should("be.visible");
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
          cy.get(template.templateCard).should(
            "have.length",
            templatesInResponse.length,
          );
          cy.get(_.templates.locators._closeTemplateDialogBoxBtn).click();
        });
      });
    });
  },
);
