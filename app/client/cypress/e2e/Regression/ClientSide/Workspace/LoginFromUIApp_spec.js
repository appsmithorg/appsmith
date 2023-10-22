import {
  entityExplorer,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";

describe("Create page & delete page from UI", function () {
  let pageid;
  it("1. Create page & delete page from UI", function () {
    cy.generateUUID().then((uid) => {
      pageid = uid;
      cy.Createpage(pageid);
      cy.get(`.t--entity-name`).contains(pageid).trigger("mouseover");
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: pageid,
        action: "Delete",
        entityType: entityItems.Page,
      });
    });
  });
});
