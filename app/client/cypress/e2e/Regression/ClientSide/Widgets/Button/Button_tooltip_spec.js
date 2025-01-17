const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Button Widget Functionality - Validate tooltip visibility",
  { tags: ["@tag.All", "@tag.Button", "@tag.Binding"] },
  function () {
    before(() => {
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.BUTTON,
        300,
        300,
      );
    });

    it("1. Validate show/hide tooltip feature on normal button", function () {
      // Add tooltip
      _.propPane.UpdatePropertyFieldValue(
        "Tooltip",
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
      );

      // Hover in
      _.agHelper
        .GetElement(_.locators._widgetInCanvas(_.draggableWidgets.BUTTON))
        .realHover();
      // Check if a tooltip is displayed
      cy.get(".btnTooltipContainer .bp3-popover2-content").should(
        "have.text",
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
      );
      // Hover out
      cy.get(widgetsPage.buttonWidget).trigger("mouseout");
      // Check if the tooltip is disappeared
      cy.get(".bp3-popover2-content").should("not.exist");
    });

    it("2. Validate show/hide tooltip feature for a disabled button on deploy", function () {
      // Disable the button
      cy.get(".t--property-control-disabled .ads-v2-switch").click({
        force: true,
      });
      cy.validateDisableWidget(
        widgetsPage.buttonWidget,
        commonlocators.disabledField,
      );
      // Publish
      _.deployMode.DeployApp();
      // Hover in
      _.agHelper
        .GetElement(_.locators._widgetInDeployed(_.draggableWidgets.BUTTON))
        .realHover();
      //cy.get(publish.buttonWidget).trigger("mouseover");
      // Check if a tooltip is displayed
      cy.get("body").then(($ele) => {
        if ($ele.find(".bp3-popover2-content").length <= 0) {
          cy.get(publish.buttonWidget).trigger("mouseover");
        }
      });
      cy.get(".bp3-popover2-content").should(
        "have.text",
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
      );
      // Hover out
      cy.get(publish.buttonWidget).trigger("mouseout");
      // Check if the tooltip is disappeared
      cy.get(".bp3-popover2-content").should("not.exist");
    });
  },
);
