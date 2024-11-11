const commonlocators = require("../../../../../../locators/commonlocators.json");
import * as _ from "../../../../../../support/Objects/ObjectsCore";

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;

describe(
  "Modal, Radio, Checkbox widget",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("Listv2/ListWithModalStatCheckboxAndRadio");
    });
    it("1. CurrentView Works in modal", function () {
      cy.get(`${widgetSelector("Text4")} ${commonlocators.bodyTextStyle}`)
        .first()
        .should("have.text", "");

      cy.wait(1000);

      cy.get(`${widgetSelector("Input1")} textarea`)
        .first()
        .type("Leo Messi", { force: true })
        .wait(1000);

      cy.get(`${widgetSelector("Text4")} ${commonlocators.bodyTextStyle}`)
        .first()
        .should("have.text", "Leo Messi");

      cy.get(`${widgetSelector("IconButton1")} button`)
        .first()
        .click({ force: true });
      cy.wait(200);

      cy.get(`${widgetSelector("Text6")} ${commonlocators.bodyTextStyle}`)
        .first()
        .should("have.text", "Leo Messi");

      cy.get(`${widgetSelector("IconButton2")} button`).click({ force: true });
      cy.wait(2000);
    });

    it("2. Radio And Checkbox connected to modal", function () {
      cy.get(`${widgetSelector("RadioGroup1")} [type="radio"]`).check("N", {
        force: true,
      });

      cy.get(`${widgetSelector("Radio")} ${commonlocators.bodyTextStyle}`)
        .first()
        .should("have.text", "N");

      cy.get(`${widgetSelector("IconButton4")} button`).click({ force: true });
    });
  },
);
