import {
  AppSidebar,
  AppSidebarButton,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

const dsl = require("../../../../fixtures/widgetSelection.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Widget Selection",
  { tags: ["@tag.Widget", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("widgetSelection");
    });

    it("1. Multi Select widgets using cmd + click", function () {
      cy.get(`#${dsl.dsl.children[0].widgetId}`).click({
        ctrlKey: true,
      });
      cy.get(`#${dsl.dsl.children[1].widgetId}`).click({
        ctrlKey: true,
      });
      cy.get(`div[data-testid='t--selected']`).should("have.length", 2);
      cy.get(`#${dsl.dsl.children[2].widgetId}`).click({
        ctrlKey: true,
      });
      cy.get(`div[data-testid='t--selected']`).should("have.length", 3);
      cy.get(`#${dsl.dsl.children[0].widgetId}`).click({
        ctrlKey: true,
      });
      cy.get(`div[data-testid='t--selected']`).should("have.length", 2);

      cy.get(`.t--multi-selection-box`).should("have.length", 1);
    });

    it("2. Select widgets using cmd + click and open property pane by clicking on the widget from right side panel", function () {
      // Selection
      cy.get(`#${dsl.dsl.children[0].widgetId}`).click({
        ctrlKey: true,
      });
      cy.get(`#${dsl.dsl.children[2].widgetId}`).click({
        ctrlKey: true,
      });
      cy.get(`div[data-testid='t--selected']`).should("have.length", 2);
      cy.get(`.t--multi-selection-box`).should("have.length", 1);

      //select on one of the widgets from the right side panel
      cy.get(`.t-multi-widget-property-pane`).should("have.length", 1);
      cy.get(`#${dsl.dsl.children[2].widgetId}`).should("have.length", 1);
      cy.get(`#widget_name_${dsl.dsl.children[2].widgetId}`).click({
        force: true,
      });

      //should open property pane
      cy.get(`.t--property-pane-view`).should("have.length", 1);
    });

    it("3. Should not select widgets if we hit CTRL + A on other Pages", function () {
      // Click to create a New Data Source
      _.dataSources.NavigateToDSCreateNew();
      // Hit CTRL +A
      cy.get("body").type("{ctrl}{a}");
      // Switch to the Canvas
      AppSidebar.navigate(AppSidebarButton.Editor);
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      // Widgets should not be selected
      cy.get(".t--multi-selection-box").should("not.exist");
    });
  },
);
