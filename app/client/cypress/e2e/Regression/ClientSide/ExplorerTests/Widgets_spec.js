import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const apiwidget = require("../../../../locators/apiWidgetslocator.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Entity explorer tests related to widgets and validation",
  { tags: ["@tag.IDE"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("displayWidgetDsl");
    });

    it("1. Widget edit/delete/copy to clipboard validation", function () {
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget, {}, [
        "Container4",
      ]);
      _.entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Text1",
        action: "Show bindings",
      });
      cy.get(apiwidget.propertyList).then(function ($lis) {
        expect($lis).to.have.length(2);
        expect($lis.eq(0)).to.contain("{{Text1.isVisible}}");
        expect($lis.eq(1)).to.contain("{{Text1.text}}");
      });
      _.entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Text1",
        action: "Rename",
      });
      cy.EditApiNameFromExplorer("TextUpdated");
      _.entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "TextUpdated",
        action: "Show bindings",
      });
      cy.get(apiwidget.propertyList).then(function ($lis) {
        expect($lis).to.have.length(2);
        expect($lis.eq(0)).to.contain("{{TextUpdated.isVisible}}");
        expect($lis.eq(1)).to.contain("{{TextUpdated.text}}");
      });
      cy.DeleteWidgetFromSideBar();
    });
  },
);
