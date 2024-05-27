import {
  agHelper,
  entityExplorer,
  locators,
  deployMode,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";

describe("Widget Archival", { tags: ["@tag.Widget"] }, function () {
  before(() => {
    agHelper.AddDsl("ArchiveWidgetDsl");
  });

  it("1. When a widget is archived, it should be removed from the canvas but remain visible in the left pane archived section", () => {
    entityExplorer.ArchiveWidgetFromEntityExplorer("Container1");
    agHelper.WaitUntilEleDisappear(locators._containerWidget);

    cy.get(locators._archivedWidget("Container1")).should("exist");

    deployMode.DeployApp();
    agHelper.AssertElementAbsence(locators._widgetInDeployed("Container1"));
    deployMode.NavigateBacktoEditor();

    EditorNavigation.NavigateToWidget("Container1");
    PageLeftPane.expandCollapseItem("Container1");

    cy.get(locators._unarchivedWidget("Container1")).should("not.exist");
    cy.get(locators._unarchivedWidget("Text1")).should("not.exist");
    cy.get(locators._unarchivedWidget("Text2")).should("not.exist");

    // Ensure that the widget is removed from the canvas
    agHelper.AssertElementAbsence(locators._containerWidget);
  });

  it("2. Upon unarchiving, the state prior to archiving should be achieved", () => {
    entityExplorer.UnarchiveWidgetFromEntityExplorer("Container1");
    agHelper.WaitUntilEleAppear(locators._containerWidget);

    cy.get(locators._unarchivedWidget("Container1")).should("exist");
    cy.get(locators._unarchivedWidget("Text1")).should("exist");
    cy.get(locators._unarchivedWidget("Text2")).should("exist");

    // Ensure that the widget is added back to the canvas
    agHelper.AssertElementExist(locators._containerWidget);
  });

  it("3. If we archive a widget which already has archived children, upon archiving it, all its children should be grouped together", () => {
    entityExplorer.ArchiveWidgetFromEntityExplorer("Text1");
    entityExplorer.ArchiveWidgetFromEntityExplorer("Container1");

    agHelper.WaitUntilEleDisappear(locators._containerWidget);

    // Verify that the container widget and its children are archived
    cy.get(locators._archivedWidget("Container1")).should("exist");
    cy.get(locators._archivedWidget("Text1")).should("exist");
    cy.get(locators._archivedWidget("Text2")).should("exist");

    // Unarchive the container widget
    entityExplorer.UnarchiveWidgetFromEntityExplorer("Container1");
    agHelper.WaitUntilEleAppear(locators._containerWidget);

    // If we copy and paste the container widget, the children should be grouped together
    entityExplorer.CopyPasteWidget("Container1");
    cy.get(locators._unarchivedWidget("Container1Copy")).should("exist");
  });

  it("4. A widget can be deleted whilst archived", () => {
    entityExplorer.ArchiveWidgetFromEntityExplorer("Container1Copy");
    PageLeftPane.expandCollapseItem("Container1Copy");

    // Delete each archived widget one by one
    entityExplorer.DeleteWidgetFromEntityExplorer("Text1Copy");
    cy.get(locators._unarchivedWidget("Text1Copy")).should("not.exist");

    entityExplorer.DeleteWidgetFromEntityExplorer("Text2Copy");
    cy.get(locators._unarchivedWidget("Text2Copy")).should("not.exist");

    entityExplorer.DeleteWidgetFromEntityExplorer("Container1Copy");
    cy.get(locators._unarchivedWidget("Container1Copy")).should("not.exist");
  });

  it("5. If a widget is deleted and has archived children, they must become children of the main container widget", () => {
    entityExplorer.ArchiveWidgetFromEntityExplorer("Text2");
    entityExplorer.DeleteWidgetFromEntityExplorer("Container1");
    entityExplorer.UnarchiveWidgetFromEntityExplorer("Text2");

    // Verify that the child widget is now a child of the main container widget
    cy.get(locators._unarchivedWidget("Text2")).should("exist");

    // Ensure that the widget is added back to the canvas
    agHelper.AssertElementExist(locators._textWidget);
  });
});
