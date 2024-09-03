import {
  agHelper,
  assertHelper,
  deployMode,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Custom widget Tests",
  { tags: ["@tag.Widget", "@tag.excludeForAirgap"] },
  function () {
    before(() => {
      agHelper.AddDsl("customWidget");
    });

    const getIframeBody = () => {
      // get the iframe > document > body
      // and retry until the body element is not empty
      return cy
        .get(".t--widget-customwidget iframe")
        .its("0.contentDocument")
        .should("exist")
        .its("body")
        .should("not.be.undefined")
        .then(cy.wrap);
    };

    it("shoud check that default model changes are converyed to custom component", () => {
      agHelper.AssertElementExist(locators._widgetInDeployed("customwidget"));
      cy.intercept("https://api.segment.io/v1/b").as("widgetLoad");
      assertHelper.WaitForNetworkCall("widgetLoad");
      getIframeBody().find(".tip-container").should("exist");

      agHelper.GetElement(".t--text-widget-container").should("have.text", "");

      getIframeBody().find("button.primary").trigger("click");

      agHelper.GetElement(".t--text-widget-container").should("have.text", "1");

      getIframeBody().find("button.reset").trigger("click");

      agHelper.ValidateToastMessage("Successfully reset from 1");

      agHelper.GetElement(".t--text-widget-container").should("have.text", "0");
    });
  },
);
