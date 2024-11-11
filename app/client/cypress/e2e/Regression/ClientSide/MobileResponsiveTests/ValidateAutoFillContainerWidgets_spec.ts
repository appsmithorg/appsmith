import * as _ from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Validating Mobile Views",
  { tags: ["@tag.MobileResponsive"] },
  function () {
    it("1. Validate change with height width for widgets", function () {
      _.agHelper.AddDsl("AutolayoutWidgetsDsl");
      //cy.openPropertyPane("containerwidget");
      EditorNavigation.SelectEntityByName("Container1", EntityType.Widget);
      cy.get(".t--widget-containerwidget")
        .first()
        .invoke("css", "height")
        .then((height) => {
          EditorNavigation.SelectEntityByName("Container2", EntityType.Widget);
          cy.get(".t--widget-containerwidget")
            .invoke("css", "height")
            .then((newheight) => {
              _.deployMode.DeployApp();
              cy.get(".t--widget-containerwidget")
                .first()
                .invoke("css", "height")
                .then((height) => {
                  cy.get(".t--widget-containerwidget")
                    .last()
                    .invoke("css", "height")
                    .then((newheight) => {
                      expect(height).to.equal(newheight);
                    });
                });
              cy.get(".t--widget-containerwidget")
                .first()
                .invoke("css", "width")
                .then((width) => {
                  cy.get(".t--widget-containerwidget")
                    .last()
                    .invoke("css", "width")
                    .then((newwidth) => {
                      expect(width).to.equal(newwidth);
                    });
                });
            });
        });
    });
  },
);
