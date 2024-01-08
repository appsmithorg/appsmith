import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Validating use cases for Table Widget in AutoLayout mode",
  { tags: ["@tag.MobileResponsive"] },
  () => {
    before(() => {
      _.autoLayout.ConvertToAutoLayoutAndVerify(false);
      _.agHelper.Sleep(2000);
      _.agHelper.AddDsl("AutoLayoutTableWidgetDsl");
    });

    // Fix for #22911, #22907
    it("1. Verify if pageSize property changes are different on mobile and desktop", () => {
      _.agHelper
        .GetElement(_.locators._textWidget)
        .invoke("text")
        .then((text) => {
          _.table
            .GetNumberOfRows()
            .then((rows) => expect(rows).to.eq(parseInt(text)));
        });

      _.agHelper.GetHeight(_.locators._tableWidget);
      cy.get("@eleHeight").then(($initialHeight) => {
        // Switch to mobile breakpoint
        _.agHelper.SetCanvasViewportWidth(375);
        _.agHelper.Sleep();
        _.agHelper.GetHeight(_.locators._tableWidget);

        // Assert if Table's height is increased in mobile breakpoint (since mobileBottomRow is more than bottomRow in the DSL)
        cy.get("@eleHeight").then(($finalHeight) => {
          cy.log("final", $initialHeight);
          expect($finalHeight).to.be.greaterThan(Number($initialHeight));
        });

        // Verify if the number of rows are same as the pageSize in mobile breakpoint
        _.agHelper
          .GetElement(_.locators._textWidget)
          .invoke("text")
          .then((text) => {
            _.table.GetNumberOfRows().then((rows) => {
              expect(rows).to.eq(parseInt(text));
            });
          });
      });
    });
  },
);
