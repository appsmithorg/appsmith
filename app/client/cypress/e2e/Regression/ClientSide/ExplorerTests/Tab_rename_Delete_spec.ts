import explorer from "../../../../locators/explorerlocators.json";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Tab widget test", function () {
  const tabname = "UpdatedTab";
  before(() => {
    cy.fixture("tabdsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. Tab Widget Functionality To rename Tabs from entity explorer", function () {
    _.entityExplorer.ExpandCollapseEntity("Widgets");
    _.entityExplorer.ExpandCollapseEntity("Tabs1");
    _.entityExplorer.RenameEntityFromExplorer("Tab1", tabname, true);
  });

  it("2. Tab Widget Functionality To delete Tabs from entity explorer", function () {
    _.entityExplorer.ExpandCollapseEntity("Widgets");
    _.entityExplorer.ExpandCollapseEntity("Tabs1");
    _.entityExplorer.ActionContextMenuByEntityName("Tab2", "Edit name");
    _.agHelper.TypeText(_.locators._entityNameEditing("Tab2"), tabname);
    _.agHelper.Sleep(2000);
    _.entityExplorer.ValidateDuplicateMessageToolTip(tabname);
    cy.get(explorer.editEntity)
      .last()
      .click()
      .type("Tab2" + "{enter}", { force: true });
    _.entityExplorer.DeleteWidgetFromEntityExplorer(tabname + "Tab2");
  });

  /* To be enabled once the bug is fixed
    it("Publish app and check for the widget name", function() {
      cy.PublishtheApp();
      cy.get(publish.tabWidget)
        .contains(tabname)
        .click({ force: true })
        .should("be.selected");
      cy.get(publish.tabWidget)
        .contains("Tab 2")
        .click({ force: true })
        .should("be.selected");
    });

    it("Tab Widget Functionality To Unchecked Visible Widget", function() {
      cy.get(publish.backToEditor).first().click();
      cy.openPropertyPane("tabswidget");
      cy.closePropertyPane();
      cy.get(Layoutpage.tabWidget)
        .contains("Tab 2")
        .click({ force: true })
        .should("not.be.visible");
    });
    */
});

afterEach(() => {
  // put your clean up code if any
});
