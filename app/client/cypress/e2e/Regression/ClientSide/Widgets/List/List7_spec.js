import * as _ from "../../../../../support/Objects/ObjectsCore";
const commonlocators = require("../../../../../locators/commonlocators.json");

describe(
  "Binding the list widget with text widget",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("ListVulnerabilityDSL");
    });

    it("1. Validate that list widget doesn't execute code", function () {
      cy.get(".t--widget-inputwidgetv2 input")
        .eq(1)
        .type("'+(function() { return 3; })()+'", {
          parseSpecialCharSequences: false,
        });
      cy.wait(1000);
      cy.get(".t--widget-buttonwidget").eq(0).click();
      cy.get(commonlocators.toastmsg).contains(
        "'+(function() { return 3; })()+'",
      );

      cy.get(".t--widget-inputwidgetv2 input")
        .eq(1)
        .clear()
        .type("`+(function() { return 3; })()+`", {
          parseSpecialCharSequences: false,
        });
      cy.wait(1000);
      cy.get(".t--widget-buttonwidget").eq(0).click();
      cy.get(commonlocators.toastmsg).should(
        "contain",
        "`+(function() { return 3; })()+`",
      );

      cy.get(".t--widget-inputwidgetv2 input")
        .eq(1)
        .clear()
        .type('"+(function() { return 3; })()+"', {
          parseSpecialCharSequences: false,
        });
      cy.wait(1000);
      cy.get(".t--widget-buttonwidget").eq(0).click();
      cy.get(commonlocators.toastmsg).should(
        "contain",
        '"+(function() { return 3; })()+"',
      );
    });
  },
);
