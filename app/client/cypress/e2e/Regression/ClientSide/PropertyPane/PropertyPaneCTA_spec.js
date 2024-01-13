import * as _ from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Property pane CTA to add an action",
  { tags: ["@tag.PropertyPane"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("TextTabledsl");
    });

    it("1. Check if CTA is shown when there is no action", function () {
      cy.openPropertyPane("tablewidget");
      cy.get(".t--propertypane-connect-cta")
        .scrollIntoView()
        .should("be.visible");
      //Check if CTA does not exist when there is an action
      _.apiPage.CreateApi("FirstAPI");
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget, {}, [
        "Container3",
      ]);
      cy.get(".t--propertypane-connect-cta").should("not.exist");
    });
  },
);
