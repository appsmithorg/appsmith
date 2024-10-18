import {
  agHelper,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

import { format } from "date-fns";
import { datePickerlocators } from "../../../../../locators/WidgetLocators";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Date picker widget testcases",
  { tags: ["@tag.Widget", "@tag.Datepicker", "@tag.Binding"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.DATEPICKER);
    });

    afterEach(() => {
      deployMode.NavigateBacktoEditor();
    });

    it("1. Sets and asserts a date format ", () => {
      agHelper.GetNClick(propPane._selectPropDropdown("Date format"));
      agHelper
        .GetAttribute(datePickerlocators.options, "label", 7)
        .then((dateFormatToSet: any) => {
          agHelper.GetNClick(propPane._dropDownValue(dateFormatToSet), 0, true);
          agHelper
            .GetAttribute(datePickerlocators.input, "value")
            .then((labelValue) => {
              expect(labelValue).to.equal(dateFormatToSet);
            });
        });

      deployMode.DeployApp();
      agHelper.GetNClick(datePickerlocators.input);
      agHelper.ClickButton("Clear");
      agHelper
        .GetAttribute(datePickerlocators.input, "value")
        .then((labelValue) => {
          expect(labelValue).to.equal("");
        });
      agHelper.GetNClick(datePickerlocators.selectYear, 0, true);

      agHelper
        .GetAttribute(datePickerlocators.dayPick, "aria-label")
        .then((dateValueSet: any) => {
          agHelper.GetNClick(datePickerlocators.dayPick);
          agHelper.GetNClick(datePickerlocators.input);
          agHelper
            .GetAttribute(datePickerlocators.input, "value")
            .then((labelValue) => {
              const formattedDate = format(
                new Date(dateValueSet),
                "d MMMM, yyyy",
              );
              expect(labelValue).to.contain(formattedDate);
            });
        });
    });

    it("2. Assert time precision - None, Minute, Second ", () => {
      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);

      agHelper.GetNClick(propPane._selectPropDropdown("Date format"));
      agHelper
        .GetAttribute(datePickerlocators.options, "label", 0)
        .then((dateFormatToSet: any) => {
          agHelper.GetNClick(propPane._dropDownValue(dateFormatToSet), 0, true);
        });
      propPane.SelectPropertiesDropDown("Time precision", "None");
      deployMode.DeployApp();
      agHelper.GetNClick(datePickerlocators.input);
      agHelper.AssertElementAbsence(datePickerlocators.inputHour);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("Time precision", "Minute");
      deployMode.DeployApp();
      agHelper.GetNClick(datePickerlocators.input);
      agHelper.AssertElementExist(datePickerlocators.inputHour);
      agHelper.AssertElementExist(datePickerlocators.inputMinute);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("Time precision", "Second");
      deployMode.DeployApp();
      agHelper.GetNClick(datePickerlocators.input);
      agHelper.ClearNType(datePickerlocators.inputHour, "12", 0, true);
      agHelper.ClearNType(datePickerlocators.inputMinute, "58", 0, true);
      agHelper.ClearNType(datePickerlocators.inputSecond, "59", 0, true);
      agHelper.PressEnter();
      agHelper
        .GetAttribute(datePickerlocators.input, "value")
        .then((labelValue) => {
          expect(labelValue).to.contain("12:58:59");
        });
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);

      agHelper.GetNClick(propPane._selectPropDropdown("Date format"));
      agHelper
        .GetAttribute(datePickerlocators.options, "label", 15)
        .then((dateFormatToSet: any) => {
          agHelper.GetNClick(propPane._dropDownValue(dateFormatToSet), 0, true);
        });
      propPane.SelectPropertiesDropDown("Time precision", "Second");

      deployMode.DeployApp();

      agHelper.GetNClick(datePickerlocators.input);
      agHelper.ClearNType(datePickerlocators.inputHour, "12", 0, true);
      agHelper.ClearNType(datePickerlocators.inputMinute, "58", 0, true);
      agHelper.ClearNType(datePickerlocators.inputSecond, "59", 0, true);
      agHelper.PressEnter();
      agHelper
        .GetAttribute(datePickerlocators.input, "value")
        .then((labelValue) => {
          expect(labelValue).to.not.contain("12:58:59");
        });
    });

    it("3. Assert First day of the week - (0-6) Sunday - Saturday ", () => {
      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("First Day Of Week", "0");
      deployMode.DeployApp();
      agHelper.GetNClick(datePickerlocators.input);
      // assert is the first day is Sunday to last day is Saturday
      agHelper.GetNAssertElementText(
        datePickerlocators.weekDay,
        "Su",
        "have.text",
      );
      agHelper.GetNAssertElementText(
        datePickerlocators.weekDay,
        "Mo",
        "have.text",
        1,
      );
      agHelper.GetNAssertElementText(
        datePickerlocators.weekDay,
        "Tu",
        "have.text",
        2,
      );
      agHelper.GetNAssertElementText(
        datePickerlocators.weekDay,
        "We",
        "have.text",
        3,
      );
      agHelper.GetNAssertElementText(
        datePickerlocators.weekDay,
        "Th",
        "have.text",
        4,
      );
      agHelper.GetNAssertElementText(
        datePickerlocators.weekDay,
        "Fr",
        "have.text",
        5,
      );
      agHelper.GetNAssertElementText(
        datePickerlocators.weekDay,
        "Sa",
        "have.text",
        6,
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);
      // Change the first day of the week to Monday and assert
      propPane.UpdatePropertyFieldValue("First Day Of Week", "1");
      deployMode.DeployApp();
      agHelper.GetNClick(datePickerlocators.input);
      agHelper.GetNAssertElementText(
        datePickerlocators.weekDay,
        "Mo",
        "have.text",
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);
      // Change the first day of the week to Tuesday and assert
      propPane.UpdatePropertyFieldValue("First Day Of Week", "2");
      deployMode.DeployApp();
      agHelper.GetNClick(datePickerlocators.input);
      agHelper.GetNAssertElementText(
        datePickerlocators.weekDay,
        "Tu",
        "have.text",
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("First Day Of Week", "3");
      deployMode.DeployApp();
      agHelper.GetNClick(datePickerlocators.input);
      agHelper.GetNAssertElementText(
        datePickerlocators.weekDay,
        "We",
        "have.text",
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("First Day Of Week", "4");
      deployMode.DeployApp();
      agHelper.GetNClick(datePickerlocators.input);
      agHelper.GetNAssertElementText(
        datePickerlocators.weekDay,
        "Th",
        "have.text",
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("First Day Of Week", "5");
      deployMode.DeployApp();
      agHelper.GetNClick(datePickerlocators.input);
      agHelper.GetNAssertElementText(
        datePickerlocators.weekDay,
        "Fr",
        "have.text",
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("First Day Of Week", "6");
      deployMode.DeployApp();
      agHelper.GetNClick(datePickerlocators.input);
      agHelper.GetNAssertElementText(
        datePickerlocators.weekDay,
        "Sa",
        "have.text",
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("First Day Of Week", "7");
      agHelper.VerifyEvaluatedErrorMessage("Number should be between 0-6.");
      propPane.UpdatePropertyFieldValue("First Day Of Week", "0");
      deployMode.DeployApp();
    });

    it("4. Assert Min Date and Max Date set ", () => {
      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);
      // set min date
      agHelper.GetNClick(locators._existingFieldTextByName("Min Date"));
      agHelper.GetNClick(datePickerlocators.calendarHeader, 2);
      agHelper.GetNClick(datePickerlocators.year("2022"), 0, true);
      agHelper.GetNClick(datePickerlocators.calendarHeader, 1);
      agHelper.GetNClick(dataSources._visibleTextSpan("Jan"), 0, true);
      agHelper.GetNClick(datePickerlocators.date("001"));
      // set max date
      agHelper.GetNClick(locators._existingFieldTextByName("Max Date"));
      agHelper.GetNClick(datePickerlocators.calendarHeader, 1);
      agHelper.GetNClick(dataSources._visibleTextSpan("Feb"), 0, true);
      agHelper.GetNClick(datePickerlocators.calendarHeader, 2);
      agHelper.GetNClick(datePickerlocators.year("2023"), 0, true);
      agHelper.GetNClick(datePickerlocators.date("010"));
      deployMode.DeployApp();
      agHelper.GetNClick(datePickerlocators.input);
      agHelper.GetNClick(datePickerlocators.selectYear, 0, true);
      // check for only years between min and max date is present
      agHelper.AssertElementExist(datePickerlocators.yearInDropdown("2022"));
      agHelper.AssertElementExist(datePickerlocators.yearInDropdown("2023"));
      agHelper.AssertElementAbsence(datePickerlocators.yearInDropdown("2000"));
      agHelper.GetNClick(datePickerlocators.yearInDropdown("2022"), 0, true);
      // check for months present between min and max date
      agHelper.GetNClick(datePickerlocators.selectMonth, 0, true);
      agHelper.AssertElementExist(
        datePickerlocators.monthInDropdown("January"),
      );
      agHelper.AssertElementExist(
        datePickerlocators.monthInDropdown("December"),
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);
      // set min date as same year as max date
      agHelper.GetNClick(locators._existingFieldTextByName("Min Date"));
      agHelper.GetNClick(datePickerlocators.calendarHeader, 2);
      agHelper.GetNClick(datePickerlocators.year("2023"), 0, true);
      agHelper.GetNClick(datePickerlocators.calendarHeader, 1);
      agHelper.GetNClick(dataSources._visibleTextSpan("Jan"), 0, true);
      agHelper.GetNClick(datePickerlocators.date("001"));
      deployMode.DeployApp();
      agHelper.GetNClick(datePickerlocators.input);
      // assert for months jan and feb as min and max date are set between them
      agHelper.AssertElementExist(
        datePickerlocators.monthInDropdown("January"),
      );
      agHelper.AssertElementExist(
        datePickerlocators.monthInDropdown("February"),
      );
      agHelper.AssertElementAbsence(
        datePickerlocators.monthInDropdown("March"),
      );
    });

    it("5. Assert onDateSelected action ", () => {
      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);
      // set an alert
      propPane.SelectPlatformFunction("onDateSelected", "Show alert");
      agHelper.EnterActionValue("Message", "Date selected");
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      deployMode.DeployApp();
      agHelper.GetNClick(datePickerlocators.input);
      // on date selection verify the toast set
      agHelper.GetNClick(datePickerlocators.dayPick, 0, true);
      agHelper.ValidateToastMessage("Date selected");
    });
  },
);
