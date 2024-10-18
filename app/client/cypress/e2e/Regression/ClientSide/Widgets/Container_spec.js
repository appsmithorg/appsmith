const widgetsPage = require("../../../../locators/Widgets.json");
const dsl = require("../../../../fixtures/containerdsl.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

const boxShadowOptions = {
  none: "none",
  S: "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px",
  M: "rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px",
  L: "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
};

describe(
  "Container Widget Functionality",
  {
    tags: ["@tag.Widget", "@tag.Container", "@tag.AutoHeight", "@tag.Binding"],
  },
  function () {
    before(() => {
      _.agHelper.AddDsl("containerdsl");
    });

    it("Container Widget Functionality", function () {
      cy.openPropertyPane("containerwidget");
      /**
       * @param{Text} Random Text
       * @param{ContainerWidget}Mouseover
       * @param{ContainerPre Css} Assertion
       */
      cy.widgetText(
        "job",
        widgetsPage.containerWidget,
        widgetsPage.widgetNameSpan,
      );
      cy.moveToStyleTab();
      /**
       * @param{Text} Random Border Colour
       */
      cy.get(widgetsPage.borderColorPickerNew)
        .first()
        .click({ force: true })
        .clear()
        .type(widgetsPage.yellowColorHex, { delay: 0 });
      cy.get(
        `div[data-testid='container-wrapper-${dsl.dsl.children[0].widgetId}']`,
      )
        .should("have.css", "border-color")
        .and("eq", "rgb(255, 193, 61)");
      /**
       * @param{Text} Random Background Colour
       */
      cy.get(widgetsPage.backgroundcolorPickerNew)
        .first()
        .click({ force: true })
        .clear()
        .type(widgetsPage.greenColorHex, { delay: 0 });
      cy.get(widgetsPage.containerD)
        .should("have.css", "background")
        .and(
          "eq",
          "rgb(3, 179, 101) none repeat scroll 0% 0% / auto padding-box border-box",
        );
      /**
       * @param{toggleButton Css} Assert to be checked
       */
      //cy.get("[data-testid=div-selection-0]").click({force:true});
      //cy.togglebar(widgetsPage.Scrollbutton);
      cy.get(widgetsPage.containerD)
        .eq(0)
        .scrollIntoView({ easing: "linear" })
        .should("be.visible");
      _.deployMode.DeployApp();
    });
    it("Container Widget Functionality To Verify The Colour", function () {
      cy.get(widgetsPage.containerD)
        .eq(0)
        .should("have.css", "background")
        .and(
          "eq",
          "rgb(3, 179, 101) none repeat scroll 0% 0% / auto padding-box border-box",
        );
    });

    it("Test border width and verity", function () {
      _.deployMode.NavigateBacktoEditor();
      cy.openPropertyPane("containerwidget");
      cy.moveToStyleTab();
      cy.testJsontext("borderwidth", "10");
      cy.get(
        `div[data-testid='container-wrapper-${dsl.dsl.children[0].widgetId}']`,
      )
        .should("have.css", "border-width")
        .and("eq", "10px");
    });

    it("Test border radius and verity", function () {
      // check if border radius is changed on button

      cy.get(
        `.t--property-control-borderradius .ads-v2-segmented-control__segments-container-segment-text > div`,
      )
        .eq(0)
        .click({ force: true });

      cy.get(
        `.t--property-control-borderradius .ads-v2-segmented-control__segments-container-segment-text > div`,
      )
        .eq(0)
        .invoke("css", "border-top-left-radius")
        .then((borderRadius) => {
          cy.get(
            `div[data-testid='container-wrapper-${dsl.dsl.children[0].widgetId}']`,
          ).should("have.css", "border-radius", borderRadius);
        });
    });

    it("Test Box shadow and verity", function () {
      cy.get(
        `.t--property-control-boxshadow .ads-v2-segmented-control__segments-container`,
      )
        .eq(1)
        .click({ force: true });

      cy.get(
        `div[data-testid='container-wrapper-${dsl.dsl.children[0].widgetId}']`,
      ).should("have.css", "box-shadow", boxShadowOptions.S);
    });

    afterEach(() => {
      // put your clean up code if any
    });
  },
);
