const commonlocators = require("../../../../../locators/commonlocators.json");

import * as _ from "../../../../../support/Objects/ObjectsCore";

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;
const widgetPrefix = ".t--widget-";

function changeValueOfWidget(widgetType, value, index) {
  cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
    .eq(index)
    .within(() => {
      switch (widgetType) {
        case "selectwidget":
          cy.SelectDropDown(value);
          break;
        case "multiselectwidgetv2":
          cy.RemoveAllSelections();
          cy.SelectFromMultiSelect(value);
          break;
        case "inputwidgetv2":
          cy.get(`${widgetPrefix}${widgetType} input`).clear();
          cy.get(`${widgetPrefix}${widgetType} input`).type(value);
          break;
        default:
          break;
      }
    });
}

function verifyValueOfWidget(widgetType, value, index) {
  cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
    .eq(index)
    .within(() => {
      switch (widgetType) {
        case "selectwidget":
          cy.get("button span.bp3-button-text")
            .first()
            .invoke("text")
            .then(($selectedValue) => {
              expect($selectedValue).to.eq(value);
            });
          break;
        case "multiselectwidgetv2":
          cy.get(`${widgetPrefix}${widgetType}`)
            .find(`.rc-select-selection-item[title='${value[0]}']`)
            .should("exist");
          break;
        case "inputwidgetv2":
          cy.get(`${widgetPrefix}${widgetType} input`).should(
            "have.value",
            value,
          );
          break;
        default:
          break;
      }
    });
}

describe(
  "List widget v2 - meta hydration tests",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  () => {
    before(() => {
      _.agHelper.AddDsl("Listv2/MetaHydrationDSL");
    });
    beforeEach(() => {
      _.agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      _.agHelper.SaveLocalStorageCache();
    });

    it("1. using client side data", () => {
      cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`).should(
        "have.length",
        3,
      );
      //FirstPage
      //   First Row
      cy.get(`${widgetSelector("List1")}`).scrollIntoView();
      changeValueOfWidget("selectwidget", "Green", 0);
      changeValueOfWidget("inputwidgetv2", "First", 0);
      changeValueOfWidget("multiselectwidgetv2", ["Green"], 0);

      //   Second Row
      changeValueOfWidget("selectwidget", "Blue", 1);
      changeValueOfWidget("inputwidgetv2", "Second", 1);
      changeValueOfWidget("multiselectwidgetv2", ["Blue"], 1);

      //   Third Row
      changeValueOfWidget("selectwidget", "Red", 2);
      changeValueOfWidget("inputwidgetv2", "Third", 2);
      changeValueOfWidget("multiselectwidgetv2", ["Red"], 2);

      //   Go to next page
      cy.get(commonlocators.listPaginateNextButton).click({
        force: true,
      });
      cy.wait(200);

      cy.waitUntil(() =>
        cy
          .get(
            `${widgetSelector(
              "List1",
            )} ${containerWidgetSelector} .t--widget-selectwidget button`,
          )
          .should("have.length", 3),
      );

      //   SecondPage
      //   First Row
      cy.get(`${widgetSelector("List1")}`).scrollIntoView();
      changeValueOfWidget("selectwidget", "Blue", 0);
      changeValueOfWidget("inputwidgetv2", "Fourth", 0);
      changeValueOfWidget("multiselectwidgetv2", ["Blue"], 0);

      //   Second Row
      changeValueOfWidget("selectwidget", "Red", 1);
      changeValueOfWidget("inputwidgetv2", "Fifth", 1);
      changeValueOfWidget("multiselectwidgetv2", ["Red"], 1);

      //   Third Row
      changeValueOfWidget("selectwidget", "Green", 2);
      changeValueOfWidget("inputwidgetv2", "Sixth", 2);
      changeValueOfWidget("multiselectwidgetv2", ["Green"], 2);

      //   Go to previous page
      cy.get(commonlocators.listPaginatePrevButton).click({
        force: true,
      });
      cy.wait(300);
      cy.waitUntil(() =>
        cy
          .get(
            `${widgetSelector(
              "List1",
            )} ${containerWidgetSelector} .t--widget-selectwidget button`,
          )
          .should("have.length", 3),
      );

      cy.waitUntil(() =>
        cy
          .get(
            `${widgetSelector(
              "List1",
            )} ${containerWidgetSelector} .t--widget-selectwidget button span.bp3-button-text`,
          )
          .first()
          .invoke("text")
          .then(($selectedValue) => {
            expect($selectedValue).to.eq("Green");
          }),
      );

      //Validate values in FirstPage
      //   First Row
      cy.get(`${widgetSelector("List1")}`).scrollIntoView();

      verifyValueOfWidget("selectwidget", "Green", 0);
      verifyValueOfWidget("inputwidgetv2", "First", 0);
      verifyValueOfWidget("multiselectwidgetv2", ["Green"], 0);

      //   Second Row
      verifyValueOfWidget("selectwidget", "Blue", 1);
      verifyValueOfWidget("inputwidgetv2", "Second", 1);
      verifyValueOfWidget("multiselectwidgetv2", ["Blue"], 1);

      //   Third Row
      verifyValueOfWidget("selectwidget", "Red", 2);
      verifyValueOfWidget("inputwidgetv2", "Third", 2);
      verifyValueOfWidget("multiselectwidgetv2", ["Red"], 2);

      //   Go to next page
      cy.get(commonlocators.listPaginateNextButton).click({
        force: true,
      });
      cy.wait(300);
      cy.waitUntil(() =>
        cy
          .get(
            `${widgetSelector(
              "List1",
            )} ${containerWidgetSelector} .t--widget-selectwidget button`,
          )
          .should("have.length", 3),
      );

      cy.waitUntil(() =>
        cy
          .get(
            `${widgetSelector(
              "List1",
            )} ${containerWidgetSelector} .t--widget-selectwidget button span.bp3-button-text`,
          )
          .first()
          .invoke("text")
          .then(($selectedValue) => {
            expect($selectedValue).to.eq("Blue");
          }),
      );

      //Validate values in SecondPage
      //   First Row
      cy.get(`${widgetSelector("List1")}`).scrollIntoView();

      verifyValueOfWidget("selectwidget", "Blue", 0);
      verifyValueOfWidget("inputwidgetv2", "Fourth", 0);
      verifyValueOfWidget("multiselectwidgetv2", ["Blue"], 0);

      //   Second Row
      verifyValueOfWidget("selectwidget", "Red", 1);
      verifyValueOfWidget("inputwidgetv2", "Fifth", 1);
      verifyValueOfWidget("multiselectwidgetv2", ["Red"], 1);

      //   Third Row
      verifyValueOfWidget("selectwidget", "Green", 2);
      verifyValueOfWidget("inputwidgetv2", "Sixth", 2);
      verifyValueOfWidget("multiselectwidgetv2", ["Green"], 2);
    });

    it("2. using client side data in view mode", () => {
      _.deployMode.DeployApp();

      cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`).should(
        "have.length",
        3,
      );
      //FirstPage
      //   First Row
      changeValueOfWidget("selectwidget", "Green", 0);
      changeValueOfWidget("inputwidgetv2", "First", 0);
      changeValueOfWidget("multiselectwidgetv2", ["Green"], 0);

      //   Second Row
      changeValueOfWidget("selectwidget", "Blue", 1);
      changeValueOfWidget("inputwidgetv2", "Second", 1);
      changeValueOfWidget("multiselectwidgetv2", ["Blue"], 1);

      //   Third Row
      changeValueOfWidget("selectwidget", "Red", 2);
      changeValueOfWidget("inputwidgetv2", "Third", 2);
      changeValueOfWidget("multiselectwidgetv2", ["Red"], 2);

      //   Go to next page
      cy.get(commonlocators.listPaginateNextButton).click({
        force: true,
      });
      cy.wait(300);
      cy.waitUntil(() =>
        cy
          .get(
            `${widgetSelector(
              "List1",
            )} ${containerWidgetSelector} .t--widget-selectwidget button`,
          )
          .should("have.length", 3),
      );

      //   SecondPage
      //   First Row
      changeValueOfWidget("selectwidget", "Blue", 0);
      changeValueOfWidget("inputwidgetv2", "Fourth", 0);
      changeValueOfWidget("multiselectwidgetv2", ["Blue"], 0);

      //   Second Row
      changeValueOfWidget("selectwidget", "Red", 1);
      changeValueOfWidget("inputwidgetv2", "Fifth", 1);
      changeValueOfWidget("multiselectwidgetv2", ["Red"], 1);

      //   Third Row
      changeValueOfWidget("selectwidget", "Green", 2);
      changeValueOfWidget("inputwidgetv2", "Sixth", 2);
      changeValueOfWidget("multiselectwidgetv2", ["Green"], 2);

      //   Go to previous page
      cy.get(commonlocators.listPaginatePrevButton).click({
        force: true,
      });

      //Validate values in FirstPage
      //   First Row
      cy.wait(300);
      cy.waitUntil(() =>
        cy
          .get(
            `${widgetSelector(
              "List1",
            )} ${containerWidgetSelector} .t--widget-selectwidget button`,
          )
          .should("have.length", 3),
      );

      cy.waitUntil(() =>
        cy
          .get(
            `${widgetSelector(
              "List1",
            )} ${containerWidgetSelector} .t--widget-selectwidget button span.bp3-button-text`,
          )
          .first()
          .invoke("text")
          .then(($selectedValue) => {
            expect($selectedValue).to.eq("Green");
          }),
      );

      cy.get(`${widgetSelector("List1")}`).scrollIntoView();

      verifyValueOfWidget("selectwidget", "Green", 0);
      verifyValueOfWidget("inputwidgetv2", "First", 0);
      verifyValueOfWidget("multiselectwidgetv2", ["Green"], 0);

      //   Second Row
      verifyValueOfWidget("selectwidget", "Blue", 1);
      verifyValueOfWidget("inputwidgetv2", "Second", 1);
      verifyValueOfWidget("multiselectwidgetv2", ["Blue"], 1);

      //   Third Row
      verifyValueOfWidget("selectwidget", "Red", 2);
      verifyValueOfWidget("inputwidgetv2", "Third", 2);
      verifyValueOfWidget("multiselectwidgetv2", ["Red"], 2);

      //   Go to next page
      cy.get(commonlocators.listPaginateNextButton).click({
        force: true,
      });

      //Validate values in SecondPage
      //   First Row
      cy.wait(300);
      cy.waitUntil(() =>
        cy
          .get(
            `${widgetSelector(
              "List1",
            )} ${containerWidgetSelector} .t--widget-selectwidget button`,
          )
          .should("have.length", 3),
      );

      cy.waitUntil(() =>
        cy
          .get(
            `${widgetSelector(
              "List1",
            )} ${containerWidgetSelector} .t--widget-selectwidget button span.bp3-button-text`,
          )
          .first()
          .invoke("text")
          .then(($selectedValue) => {
            expect($selectedValue).to.eq("Blue");
          }),
      );

      cy.get(`${widgetSelector("List1")}`).scrollIntoView();

      verifyValueOfWidget("selectwidget", "Blue", 0);
      verifyValueOfWidget("inputwidgetv2", "Fourth", 0);
      verifyValueOfWidget("multiselectwidgetv2", ["Blue"], 0);

      //   Second Row
      verifyValueOfWidget("selectwidget", "Red", 1);
      verifyValueOfWidget("inputwidgetv2", "Fifth", 1);
      verifyValueOfWidget("multiselectwidgetv2", ["Red"], 1);

      //   Third Row
      verifyValueOfWidget("selectwidget", "Green", 2);
      verifyValueOfWidget("inputwidgetv2", "Sixth", 2);
      verifyValueOfWidget("multiselectwidgetv2", ["Green"], 2);

      _.deployMode.NavigateBacktoEditor();
    });
  },
);
