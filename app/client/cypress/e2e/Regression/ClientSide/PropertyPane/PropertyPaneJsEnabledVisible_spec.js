import * as _ from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Property pane js enabled field",
  { tags: ["@tag.PropertyPane"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("jsonFormDslWithSchema");
    });

    it("1. Ensure text is visible for js enabled field when a section is collapsed by default", function () {
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      _.propPane.MoveToTab("Style");
      _.propPane.EnterJSContext("Button variant", "PRIMARY");
      cy.get(".t--property-pane-section-collapse-submitbuttonstyles").click();
      cy.closePropertyPane();
      cy.wait(1000);

      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      _.propPane.MoveToTab("Style");
      cy.wait(500);
      cy.get(".t--property-pane-section-collapse-submitbuttonstyles").click();
      cy.get(".t--property-control-buttonvariant")
        .find(".CodeMirror-code")
        .invoke("text")
        .should("equal", "PRIMARY");
    });
  },
);
