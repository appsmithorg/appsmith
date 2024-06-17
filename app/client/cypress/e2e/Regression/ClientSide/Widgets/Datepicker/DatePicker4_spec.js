import {
  draggableWidgets,
  entityExplorer,
} from "../../../../../support/Objects/ObjectsCore";
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "DatePicker Widget Property pane tests with js bindings",
  { tags: ["@tag.Widget", "@tag.Datepicker"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.DATEPICKER);
    });

    function navigateAndSelectRandomDate(direction) {
      const buttonClass =
        direction === "prev"
          ? ".DayPicker-NavButton--prev"
          : ".DayPicker-NavButton--next";
      cy.get(buttonClass).should("be.visible").click();
      cy.get(".DayPicker").should("be.visible");
      cy.get(".DayPicker-Month")
        .first()
        .find(".DayPicker-Day")
        .then(($days) => {
          const randomIndex = Math.floor(Math.random() * $days.length);
          cy.wrap($days[randomIndex]).click();
        });
    }

    it("1.should close datepicker on single click when month is changed", function () {
      cy.openPropertyPane("datepickerwidget2");
      cy.get(".t--widget-datepickerwidget2 input").click();
      cy.get(".DayPicker").should("be.visible");

      navigateAndSelectRandomDate("prev");
      cy.get(".t--widget-datepickerwidget2 input").click();
      navigateAndSelectRandomDate("prev");
      cy.get(".t--widget-datepickerwidget2 input").click();
      navigateAndSelectRandomDate("next");
    });
  },
);
