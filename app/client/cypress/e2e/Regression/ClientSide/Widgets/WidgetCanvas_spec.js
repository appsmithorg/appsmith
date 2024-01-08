const dsl = require("../../../../fixtures/longCanvasDsl.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "reduce long canvas height on widget operation",
  { tags: ["@tag.Settings"] },
  () => {
    beforeEach(() => {
      _.agHelper.AddDsl("longCanvasDsl");
    });

    it("1. Should reduce canvas height when a widget is deleted", () => {
      //select a widget
      cy.wait(2000);
      cy.get(`#${dsl.dsl.children[1].widgetId}`).click({
        ctrlKey: true,
      });
      cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

      cy.document().then((doc) => {
        const element = doc.querySelector(".appsmith_widget_0");
        const initialHeight = element.getBoundingClientRect().height;
        //delete widget
        _.propPane.DeleteWidgetFromPropertyPane("Button1");
        //canvas height should be lesser now
        cy.wait(1000).then(() => {
          expect(element.getBoundingClientRect().height).to.be.lessThan(
            initialHeight,
          );
        });
      });
    });
  },
);
