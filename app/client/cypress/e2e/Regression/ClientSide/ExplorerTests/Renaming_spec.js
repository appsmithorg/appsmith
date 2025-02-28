import PageList from "../../../../support/Pages/PageList";

const explorer = require("../../../../locators/explorerlocators.json");
import {
  apiPage,
  agHelper,
  entityExplorer,
  entityItems,
  jsEditor,
} from "../../../../support/Objects/ObjectsCore";
import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import { EntityItems } from "../../../../support/Pages/AssertHelper";

const firstApiName = "First";
const secondApiName = "Second";

describe(
  "Api Naming conflict on a page test",
  { tags: ["@tag.IDE", "@tag.PropertyPane"] },
  function () {
    it("1. Expects actions on the same page cannot have identical names", function () {
      // create an API
      apiPage.CreateApi(firstApiName);
      // create another API
      apiPage.CreateApi(secondApiName);
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      // try to rename one of the APIs with an existing API name
      cy.get(`.t--entity-item:contains(${secondApiName})`).within(() => {
        cy.get(".t--context-menu").click({ force: true });
      });
      cy.selectAction("Rename");
      cy.get(explorer.editEntity)
        .last()
        .clear()
        .type(firstApiName, { force: true });
      cy.validateMessage(firstApiName);
      agHelper.PressEnter();
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: secondApiName,
        action: "Delete",
        entityType: entityItems.Api,
      });
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: firstApiName,
        action: "Delete",
        entityType: entityItems.Api,
      });
    });
  },
);

describe(
  "Api Naming conflict on different pages test",
  { tags: ["@tag.IDE"] },
  function () {
    it("2. It expects actions on different pages can have identical names", function () {
      // create a new API
      cy.CreateAPI(firstApiName);

      // create a new page and an API on that page
      PageList.AddNewPage();
      cy.CreateAPI(firstApiName);
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      PageLeftPane.assertPresence(firstApiName);
      entityExplorer.ActionContextMenuByEntityName({
        action: "Delete",
        entityType: EntityItems.Api,
        entityNameinLeftSidebar: firstApiName,
      });
      entityExplorer.ActionContextMenuByEntityName({
        action: "Delete",
        entityType: EntityItems.Page,
        entityNameinLeftSidebar: "Page2",
      });
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      entityExplorer.ActionContextMenuByEntityName({
        action: "Delete",
        entityType: EntityItems.Api,
        entityNameinLeftSidebar: firstApiName,
      });
      cy.wait(1000);
    });
  },
);

describe("Entity Naming conflict test", { tags: ["@tag.IDE"] }, function () {
  it("3. Expects JS objects and actions to not have identical names on the same page.", function () {
    PageLeftPane.switchSegment(PagePaneSegment.JS);
    // create JS object and name it
    jsEditor.CreateJSObject('return "Hello World";');
    entityExplorer.RenameEntityFromExplorer("JSObject1", firstApiName);
    cy.wait(2000); //for the changed JS name to reflect

    cy.CreateAPI(secondApiName);

    cy.get(`.t--entity-item:contains(${secondApiName})`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.selectAction("Rename");

    cy.get(explorer.editEntity)
      .last()
      .clear()
      .type(firstApiName, { force: true });
    entityExplorer.ValidateDuplicateMessageToolTip(firstApiName);
    cy.get("body").click(0, 0);
    cy.wait(2000);
    entityExplorer.ActionContextMenuByEntityName({
      action: "Delete",
      entityNameinLeftSidebar: secondApiName,
      entityType: EntityItems.Api,
    });
    PageLeftPane.switchSegment(PagePaneSegment.JS);
    entityExplorer.ActionContextMenuByEntityName({
      action: "Delete",
      entityNameinLeftSidebar: firstApiName,
      entityType: EntityItems.JSObject,
    });
  });
});
