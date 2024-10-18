import {
  draggableWidgets,
  entityExplorer,
  agHelper,
} from "../../../../../support/Objects/ObjectsCore";
import * as _ from "../../../../../support/Objects/ObjectsCore";
import { datePickerlocators } from "../../../../../locators/WidgetLocators";

describe(
  "DatePicker Widget Property pane tests with js bindings",
  { tags: ["@tag.Widget", "@tag.Datepicker"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.DATEPICKER);
    });

    const navigateAndSelectRandomDate = (direction: string) => {
      const buttonClass =
        direction === "prev"
          ? ".DayPicker-NavButton--prev"
          : ".DayPicker-NavButton--next";
      agHelper.AssertElementVisibility(buttonClass, true, 0);
      agHelper.GetNClick(buttonClass);
      cy.get(".DayPicker-Month")
        .first()
        .find(".DayPicker-Day")
        .then(($days) => {
          const randomIndex = Math.floor(Math.random() * $days.length);
          cy.wrap($days[randomIndex]).click();
        });
    };

    it("1.should close datepicker on single click when month is changed", function () {
      agHelper.GetNClick(datePickerlocators.input);
      navigateAndSelectRandomDate("prev");
      agHelper.GetNClick(datePickerlocators.input);
      navigateAndSelectRandomDate("prev");
      agHelper.GetNClick(datePickerlocators.input);
      navigateAndSelectRandomDate("next");
    });
  },
);
