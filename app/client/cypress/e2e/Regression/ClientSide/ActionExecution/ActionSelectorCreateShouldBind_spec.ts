import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Creations via action selector should bind to the property",
  { tags: ["@tag.JS", "@tag.PropertyPane"] },
  () => {
    it("binds newly created query / api to the button onClick", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
      propPane.SelectPlatformFunction("onClick", "Execute a query");
      // For some reason, showing the modal will hang up the cypress test while it works well in general
      agHelper.GetNClick(".t--create-datasources-query-btn");
      agHelper.GetElement(".t--new-blank-api").first().click();
      cy.wait("@createNewApi");
      // Side by side is activated in this step.
      // In case the announcement modal shows up, it should be closed
      EditorNavigation.CloseAnnouncementModal();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "GETExecute a queryApi1.run",
      );
      entityExplorer.DeleteWidgetFromEntityExplorer("Button1");
    });

    it("binds newly created JSObject to the button onClick", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
      propPane.SelectPlatformFunction("onClick", "Execute a JS function");
      agHelper.GetNClick(".t--create-js-object-btn");
      cy.wait("@createNewJSCollection");
      // Side by side is activated in this step.
      // In case the announcement modal shows up, it should be closed
      EditorNavigation.CloseAnnouncementModal();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Execute a JS functionJSObject1.Button1onClick()",
      );
    });
  },
);
