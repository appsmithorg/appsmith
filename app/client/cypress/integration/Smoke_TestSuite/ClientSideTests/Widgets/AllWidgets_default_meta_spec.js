const explorer = require("../../../../locators/explorerlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const dsl = require("../../../../fixtures/defaultMetaDsl.json");

import {
  WIDGET,
  PROPERTY_SELECTOR,
  getWidgetSelector,
  getWidgetInputSelector,
} from "../../../../locators/WidgetLocators";

const widgetsToTest = {
  [WIDGET.MULTISELECT_WIDGET]: {
    testCases: [
      {
        input:
          '{{resetWidget("MultiSelect1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "MultiSelect1",
    widgetPrefixName: "MultiSelect1",
    textBindingValue: "{{MultiSelect1.selectedOptionValues}}",
    action: () => {
      cy.chooseColMultiSelectAndReset();
    },
  },
  [WIDGET.TAB]: {
    testCases: [
      {
        input: '{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "Tabs1",
    widgetPrefixName: "Tabs1",
    textBindingValue: testdata.tabBindingValue,
    action: () => {
      cy.selectTabAndReset();
    },
  },
  [WIDGET.TABLE]: {
    testCases: [
      {
        expected: "success",
      },
    ],
    widgetName: "Table1",
    widgetPrefixName: "Table1",
    textBindingValue: testdata.tableBindingValue,
    action: () => {
      cy.selectTableAndReset();
    },
  },
  [WIDGET.SWITCHGROUP]: {
    testCases: [
      {
        input: '{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "SwitchGroup1",
    widgetPrefixName: "SwitchGroup1",
    textBindingValue: testdata.switchGroupBindingValue,
    action: () => {
      cy.selectSwitchGroupAndReset();
    },
  },
  [WIDGET.SWITCH]: {
    testCases: [
      {
        input: '{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "Switch1",
    widgetPrefixName: "Switch1",
    textBindingValue: testdata.switchBindingValue,
    action: () => {
      cy.selectSwitchAndReset();
    },
  },
  [WIDGET.SELECT]: {
    testCases: [
      {
        input: '{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "Select1",
    widgetPrefixName: "Select1",
    textBindingValue: testdata.selectBindingValue,
    action: () => {
      cy.selectAndReset();
    },
  },
  [WIDGET.CURRENCY_INPUT_WIDGET]: {
    testCases: [
      {
        input: '{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "CurrencyInput1",
    widgetPrefixName: "CurrencyInput1",
    textBindingValue: testdata.currencyBindingValue,
    action: () => {
      cy.selectCurrencyInputAndReset();
    },
  },
  [WIDGET.MULTITREESELECT]: {
    testCases: [
      {
        input: '{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "MultiTreeSelect1",
    widgetPrefixName: "MultiTreeSelect1",
    textBindingValue: testdata.multitreeselectBindingValue,
    action: () => {
      cy.multiTreeSelectAndReset();
    },
  },
  [WIDGET.RADIO_GROUP]: {
    testCases: [
      {
        input: '{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "RadioGroup1",
    widgetPrefixName: "RadioGroup1",
    textBindingValue: testdata.radiogroupselectBindingValue,
    action: () => {
      cy.radiogroupAndReset();
    },
  },
  [WIDGET.LIST]: {
    testCases: [
      {
        input: '{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "List1",
    widgetPrefixName: "List1",
    textBindingValue: testdata.listBindingValue,
    action: () => {
      cy.listwidgetAndReset();
    },
  },
  [WIDGET.RATING]: {
    testCases: [
      {
        input: '{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "Rating1",
    widgetPrefixName: "Rating1",
    textBindingValue: testdata.ratingBindingValue,
    action: () => {
      cy.ratingwidgetAndReset();
    },
  },
  [WIDGET.CHECKBOXGROUP]: {
    testCases: [
      {
        input: '{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "CheckboxGroup1",
    widgetPrefixName: "CheckboxGroup1",
    textBindingValue: testdata.checkboxGroupBindingValue,
    action: () => {
      cy.checkboxGroupAndReset();
    },
  },
  [WIDGET.CHECKBOX]: {
    testCases: [
      {
        input: '{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "Checkbox1",
    widgetPrefixName: "Checkbox1",
    textBindingValue: testdata.checkboxBindingValue,
    action: () => {
      cy.checkboxAndReset();
    },
  },
  [WIDGET.AUDIO]: {
    testCases: [
      {
        input: '{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "Audio1",
    widgetPrefixName: "Audio1",
    textBindingValue: testdata.audioBindingValue,
    action: () => {
      cy.audioWidgetAndReset();
    },
  },
  [WIDGET.AUDIORECORDER]: {
    testCases: [
      {
        input: '{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "AudioRecorder1",
    widgetPrefixName: "AudioRecorder1",
    textBindingValue: testdata.audioRecorderBindingValue,
    action: () => {
      cy.audioRecorderWidgetAndReset();
    },
  },
  [WIDGET.PHONEINPUT]: {
    testCases: [
      {
        input: '{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "PhoneInput1",
    widgetPrefixName: "PhoneInput1",
    textBindingValue: testdata.phoneBindingValue,
    action: () => {
      cy.phoneInputWidgetAndReset();
    },
  },
  [WIDGET.FILEPICKER]: {
    testCases: [
      {
        input: '{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}',
        expected: "success",
        clearBeforeType: true,
      },
    ],
    widgetName: "FilePicker1",
    widgetPrefixName: "FilePicker1",
    textBindingValue: testdata.fileBindingValue,
    action: () => {
      cy.filePickerWidgetAndReset();
    },
  },
};

Object.entries(widgetsToTest).forEach(([widgetSelector, testConfig]) => {
  describe(`${testConfig.widgetName} widget test for validating reset action`, () => {
    before(() => {
      cy.addDsl(dsl);
    });

    it(`1. DragDrop Widget ${testConfig.widgetName}`, () => {
      cy.get(explorer.addWidget).click();
      cy.dragAndDropToCanvas(widgetSelector, { x: 300, y: 200 });
      cy.get(getWidgetSelector(widgetSelector)).should("exist");
    });

    it("2. Bind Button on click  and Text widget content", () => {
      // Set onClick action, storing value
      cy.openPropertyPane(WIDGET.BUTTON_WIDGET);

      cy.get(PROPERTY_SELECTOR.onClick)
        .find(".t--js-toggle")
        .click();
      cy.updateCodeInput(
        PROPERTY_SELECTOR.onClick,
        `{{resetWidget("${testConfig.widgetPrefixName}",true).then(() => showAlert("success"))}}`,
      );
      // Bind to stored value above
      cy.openPropertyPane(WIDGET.TEXT);
      cy.updateCodeInput(PROPERTY_SELECTOR.text, testConfig.textBindingValue);
    });

    it("3. Publish the app and check the reset action", () => {
      // Set onClick action, storing value
      cy.PublishtheApp();
      testConfig.action();
      cy.get(".t--toast-action span").contains("success");
    });

    it("4. Delete all the widgets on canvas", () => {
      cy.goToEditFromPublish();
      cy.get(getWidgetSelector(widgetSelector)).click();
      cy.get("body").type(`{del}`, { force: true });
    });
  });
});
