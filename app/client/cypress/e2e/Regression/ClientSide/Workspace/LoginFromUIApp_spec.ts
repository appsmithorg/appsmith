import {
  entityExplorer,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Create page & delete page from UI",
  { tags: ["@tag.Workspace", "@tag.AccessControl"] },
  function () {
    let pageid;
    it("1. Create page & delete page from UI", function () {
      cy.generateUUID().then((uid) => {
        pageid = uid;
        cy.Createpage(pageid);
        EditorNavigation.SelectEntityByName(pageid, EntityType.Page);
        entityExplorer.ActionContextMenuByEntityName({
          entityNameinLeftSidebar: pageid,
          action: "Delete",
          entityType: entityItems.Page,
        });
      });
    });
  },
);
