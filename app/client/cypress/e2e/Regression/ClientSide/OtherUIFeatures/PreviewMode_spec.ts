import { PageLeftPane } from "../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../locators/commonlocators.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Preview mode functionality",
  { tags: ["@tag.IDE", "@tag.Sanity", "@tag.PropertyPane"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("previewMode");
    });

    it("1. Checks entity explorer and property pane visiblity", function () {
      _.agHelper.GetNClick(_.locators._previewModeToggle("edit"));
      // in preview mode, entity explorer and property pane are not visible
      cy.get(PageLeftPane.locators.selector).should("not.be.visible");
      cy.get(".t--property-pane-sidebar").should("not.be.visible");

      //checks if widgets can be selected or not
      // in preview mode, entity explorer and property pane are not visible
      // Also, draggable and resizable components are not available.
      const selector = `.t--draggable-buttonwidget`;
      cy.wait(500);
      cy.get(selector).first().trigger("mouseover", { force: true }).wait(500);

      cy.get(
        `${selector}:first-of-type .t--widget-propertypane-toggle > .t--widget-name`,
      ).should("not.exist");
    });

    it("2. Check invisible widget should not show in proview mode and should show in edit mode", function () {
      _.agHelper.GetNClick(_.locators._previewModeToggle("preview"));
      cy.openPropertyPane("buttonwidget");
      cy.UncheckWidgetProperties(commonlocators.visibleCheckbox);

      // button should not show in preview mode
      _.agHelper.GetNClick(_.locators._previewModeToggle("edit"));
      cy.get(`${publishPage.buttonWidget} button`).should("not.exist");

      // Text widget should show
      cy.get(`${publishPage.textWidget} .bp3-ui-text`).should("exist");

      // button should show in edit mode
      _.agHelper.GetNClick(_.locators._previewModeToggle("preview"));
      cy.get(`${publishPage.buttonWidget} button`).should("exist");
    });
  },
);
