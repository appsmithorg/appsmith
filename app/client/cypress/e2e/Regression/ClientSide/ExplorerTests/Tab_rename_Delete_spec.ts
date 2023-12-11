import explorer from "../../../../locators/explorerlocators.json";
import {
  agHelper,
  entityExplorer,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import { PageLeftPane } from "../../../../support/Pages/EditorNavigation";

describe("Tab widget test", function () {
  const tabname = "UpdatedTab";
  before(() => {
    agHelper.AddDsl("tabdsl");
  });

  it("1. Tab Widget Functionality To rename Tabs from entity explorer", function () {
    PageLeftPane.expandCollapseItem("Widgets");
    PageLeftPane.expandCollapseItem("Tabs1");
    entityExplorer.RenameEntityFromExplorer("Tab1", tabname, true);
  });

  it("2. Tab Widget Functionality To delete Tabs from entity explorer", function () {
    PageLeftPane.expandCollapseItem("Widgets");
    PageLeftPane.expandCollapseItem("Tabs1");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Tab2",
      action: "Edit name",
    });
    agHelper.TypeText(locators._entityNameEditing("Tab2"), tabname);
    agHelper.Sleep(2000);
    entityExplorer.ValidateDuplicateMessageToolTip(tabname);
    cy.get(explorer.editEntity)
      .last()
      .click()
      .type("Tab2" + "{enter}", { force: true });
    entityExplorer.DeleteWidgetFromEntityExplorer(tabname + "Tab2");
  });

  /* To be enabled once the bug is fixed
    it("Publish app and check for the widget name", function() {
      deployMode.DeployApp();
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
deployMode.NavigateBacktoEditor();
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
