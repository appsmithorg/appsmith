import widgetLocators from "../../../../locators/Widgets.json";
import template from "../../../../locators/TemplatesLocators.json";
const publish = require("../../../../locators/publishWidgetspage.json");
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
      _.agHelper.RefreshPage();
      cy.wait(5000);
      cy.AddPageFromTemplate();
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
      cy.AddPageFromTemplate();
      cy.wait(5000);
      cy.get(template.templateDialogBox).should("be.visible");
      cy.wait(4000);
      cy.xpath("//h1[text()='Meeting Scheduler']").click();
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
      cy.AddPageFromTemplate();
      cy.get(_.templates.locators._forkApp).first().click();
      cy.get(template.templateViewForkButton).should("be.visible");
      //Similar templates add icon should take user to 'select pages from template'
      _.agHelper.RefreshPage();
      cy.AddPageFromTemplate();
      // We are currentlyon on templates list page
      cy.get(_.templates.locators._forkApp).first().click();
      // Here we are on template detail page, with similar templates at the bottom
      cy.get(_.templates.locators._forkApp).first().click();

      cy.get(template.templateViewForkButton).should("be.visible");
    });

    it("3. Add page from template to show only apps with 'allowPageImport:true'", () => {
      cy.wait(5000);
      cy.CheckAndUnfoldEntityItem("Pages");
      cy.get(`.t--entity-name:contains(Page1)`)
        .trigger("mouseover")
        .click({ force: true });
      cy.wait(1000);
      cy.get(template.startFromTemplateCard).click();

      cy.get(template.templateDialogBox).should("be.visible");
      cy.wait("@fetchTemplate").then((interception) => {
        const { response } = interception;
        const templatesInResponse = response.body.data
          .filter((card) => !!card.allowPageImport)
          .map((card) => card.title);

        if (templatesInResponse.length === 0) {
          return;
        }
        cy.get(template.templateCard).then((cards) => {
          expect(cards.length).equal(templatesInResponse.length);
          const cardsInUINames = [];
          cards.each((index, card) => {
            const card = Cypress.$(card);
            const title = card.find(".title").text();
            cardsInUINames.push(title);
          });
          expect(cardsInUINames.sort().join()).to.equal(
            templatesInResponse.sort().join(),
          );
        });
      });
    });
  },
);
