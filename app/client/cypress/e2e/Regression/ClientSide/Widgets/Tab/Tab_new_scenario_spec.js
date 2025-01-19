const Layoutpage = require("../../../../../locators/Layout.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Tab widget test",
  { tags: ["@tag.All", "@tag.Tab", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tabsWithWidgetDsl");
    });
    it("Tab Widget Functionality Test with Modal on change of selected tab", function () {
      cy.openPropertyPane("tabswidget");
      cy.widgetText("tab", Layoutpage.tabWidget, widgetsPage.widgetNameSpan);
      cy.AddActionWithModal();
      cy.get(".t--draggable-buttonwidget:contains('Close')").click({
        force: true,
      });
    });

    it("Publish the app and validate the widgets displayed under each tab", function () {
      _.deployMode.DeployApp();
      cy.get(publish.buttonWidget).should("be.visible");
      cy.get(publish.textWidget).should("be.visible");
      cy.get(publish.datePickerNew).should("be.visible");
      cy.wait(3000);
      cy.get(publish.tab).contains("Tab 2").click({ force: true });
      cy.get(publish.checkboxWidget).should("be.visible");
      cy.get(publish.radioWidget).should("be.visible");

      cy.get(publish.buttonWidget).contains("Confirm").click({
        force: true,
      });
    });
  },
);
afterEach(() => {
  // put your clean up code if any
});
