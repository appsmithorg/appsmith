import testdata from "../../../../fixtures/testdata.json";
import commonlocators from "../../../../locators/commonlocators.json";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  deployMode = ObjectsRegistry.DeployMode,
  propPane = ObjectsRegistry.PropertyPane,
  table = ObjectsRegistry.TableV2,
  locator = ObjectsRegistry.CommonLocators;

import { WIDGET } from "../../../../locators/WidgetLocators";

const widgetsToTest = {
  [WIDGET.MULTISELECT]: {
    widgetName: "MultiSelect",
    widgetPrefixName: "MultiSelect1",
    textBindingValue: "{{MultiSelect1.selectedOptionValues}}",
    assertWidgetReset: () => {
      chooseColMultiSelectAndReset();
    },
  },
  [WIDGET.TAB]: {
    widgetName: "Tab",
    widgetPrefixName: "Tabs1",
    textBindingValue: testdata.tabBindingValue,
    assertWidgetReset: () => {
      selectTabAndReset();
    },
  },
  [WIDGET.TABLE]: {
    widgetName: "Table",
    widgetPrefixName: "Table1",
    textBindingValue: testdata.tableBindingValue,
    assertWidgetReset: () => {
      selectTableAndReset();
    },
  },
  [WIDGET.SWITCHGROUP]: {
    widgetName: "SwitchGroup",
    widgetPrefixName: "SwitchGroup1",
    textBindingValue: testdata.switchGroupBindingValue,
    assertWidgetReset: () => {
      selectSwitchGroupAndReset();
    },
  },
  [WIDGET.SWITCH]: {
    widgetName: "Switch",
    widgetPrefixName: "Switch1",
    textBindingValue: testdata.switchBindingValue,
    assertWidgetReset: () => {
      selectSwitchAndReset();
    },
  },
  [WIDGET.SELECT]: {
    widgetName: "Select",
    widgetPrefixName: "Select1",
    textBindingValue: testdata.selectBindingValue,
    assertWidgetReset: () => {
      selectAndReset();
    },
  },
  [WIDGET.CURRENCY_INPUT]: {
    widgetName: "CurrencyInput",
    widgetPrefixName: "CurrencyInput1",
    textBindingValue: testdata.currencyBindingValue,
    assertWidgetReset: () => {
      selectCurrencyInputAndReset();
    },
  },
  [WIDGET.MULTITREESELECT]: {
    widgetName: "MultiTreeSelect",
    widgetPrefixName: "MultiTreeSelect1",
    textBindingValue: testdata.multitreeselectBindingValue,
    assertWidgetReset: () => {
      multiTreeSelectAndReset();
    },
  },
  [WIDGET.RADIO_GROUP]: {
    widgetName: "RadioGroup",
    widgetPrefixName: "RadioGroup1",
    textBindingValue: testdata.radiogroupselectBindingValue,
    assertWidgetReset: () => {
      radiogroupAndReset();
    },
  },
  // [WIDGET.LIST]: {//Open bug hence commenting List widget #16578, #14727
  //   widgetName: "List",
  //   widgetPrefixName: "List1",
  //   textBindingValue: testdata.listBindingValue,
  //   assertWidgetReset: () => {
  //     listwidgetAndReset();
  //   },
  // },
  [WIDGET.RATING]: {
    widgetName: "Rating",
    widgetPrefixName: "Rating1",
    textBindingValue: testdata.ratingBindingValue,
    assertWidgetReset: () => {
      ratingwidgetAndReset();
    },
  },
  [WIDGET.CHECKBOXGROUP]: {
    widgetName: "CheckboxGroup",
    widgetPrefixName: "CheckboxGroup1",
    textBindingValue: testdata.checkboxGroupBindingValue,
    assertWidgetReset: () => {
      checkboxGroupAndReset();
    },
  },
  [WIDGET.CHECKBOX]: {
    widgetName: "Checkbox",
    widgetPrefixName: "Checkbox1",
    textBindingValue: testdata.checkboxBindingValue,
    assertWidgetReset: () => {
      checkboxAndReset();
    },
  },
  /*Open bug # 14692 - hence commenting
  [WIDGET.AUDIO]: {
    widgetName: "Audio",
    widgetPrefixName: "Audio1",
    textBindingValue: testdata.audioBindingValue,
    assertWidgetReset: () => {
      audioWidgetAndReset();
    },
  },
  [WIDGET.AUDIORECORDER]: {
    widgetName: "AudioRecorder",
    widgetPrefixName: "AudioRecorder1",
    textBindingValue: testdata.audioRecorderBindingValue,
    assertWidgetReset: () => {
      audioRecorderWidgetAndReset();
    },
  },
  */
  [WIDGET.PHONEINPUT]: {
    widgetName: "PhoneInput",
    widgetPrefixName: "PhoneInput1",
    textBindingValue: testdata.phoneBindingValue,
    assertWidgetReset: () => {
      phoneInputWidgetAndReset();
    },
  },
  [WIDGET.FILEPICKER]: {
    widgetName: "FilePicker",
    widgetPrefixName: "FilePicker1",
    textBindingValue: testdata.fileBindingValue,
    assertWidgetReset: () => {
      filePickerWidgetAndReset();
    },
  },
};

function chooseColMultiSelectAndReset() {
  cy.get(".rc-select-selection-overflow").click({ force: true });
  cy.get(".rc-select-item-option-content:contains('Blue')").click({
    force: true,
  });
  cy.wait(1000);
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "BLUE",
    "contain.text",
  );
  agHelper.ClickButton("Submit");
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "BLUE",
    "not.have.text",
  );
}

function selectTabAndReset() {
  cy.get(".t--tabid-tab2").click({ force: true });
  cy.wait(1000);
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "Tab 2",
    "contain.text",
  );
  agHelper.ClickButton("Submit");
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "Tab 2",
    "not.have.text",
  );
}

function selectTableAndReset() {
  table.SelectTableRow(1);
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "#2",
    "contain.text",
  );
  agHelper.ClickButton("Submit");
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "#1",
    "contain.text",
  );
}

function selectSwitchGroupAndReset() {
  cy.get(".bp3-control-indicator")
    .last()
    .click({ force: true });
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "RED",
    "contain.text",
  );
  agHelper.ClickButton("Submit");
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "RED",
    "not.have.text",
  );
}

function selectSwitchAndReset() {
  cy.get(".bp3-control-indicator")
    .last()
    .click({ force: true });
  cy.get(".t--switch-widget-active").should("not.exist");
  agHelper.ClickButton("Submit");
  cy.get(".t--switch-widget-active").should("be.visible");
}

function selectAndReset() {
  cy.get(".select-button").click({ force: true });
  cy.get(".menu-item-text")
    .contains("Blue")
    .click({ force: true });
  cy.wait(1000);
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "BLUE",
    "contain.text",
  );
  agHelper.ClickButton("Submit");
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "BLUE",
    "not.have.text",
  );
}

function selectCurrencyInputAndReset() {
  cy.get(".bp3-input")
    .click({ force: true })
    .type("123");
  cy.wait(1000);
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "123",
    "contain.text",
  );
  agHelper.ClickButton("Submit");
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "123",
    "not.have.text",
  );
}

function multiTreeSelectAndReset() {
  cy.get(".rc-tree-select-selection-overflow").click({ force: true });
  cy.get(".rc-tree-select-tree-title:contains('Red')").click({
    force: true,
  });
  cy.wait(1000);
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "RED",
    "contain.text",
  );
  agHelper.ClickButton("Submit");
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "GREEN",
    "contain.text",
  );
}

function radiogroupAndReset() {
  cy.get("input")
    .last()
    .click({ force: true });
  cy.wait(1000);
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "N",
    "contain.text",
  );
  agHelper.ClickButton("Submit");
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "Y",
    "contain.text",
  );
}

function listwidgetAndReset() {
  agHelper.Sleep();
  agHelper.GetNClick(".t--widget-containerwidget", 1, true, 2000);
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "002",
    "contain.text", 6
  );
  agHelper.ClickButton("Submit");
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "001",
    "contain.text", 6
  );
}

function ratingwidgetAndReset() {
  cy.get(".bp3-icon-star svg")
    .last()
    .click({ force: true });
  cy.wait(1000);
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "3",
    "not.have.text",
  );
  agHelper.ClickButton("Submit");
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "3",
    "contain.text",
  );
}

function checkboxGroupAndReset() {
  cy.wait(2000);
  cy.get("[data-cy=checkbox-group-container] > :nth-child(3)")
    .last()
    .should("be.visible")
    .click({ force: true });
  cy.wait(1000);
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "RED",
    "contain.text",
  );
  agHelper.ClickButton("Submit");
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "RED",
    "not.have.text",
  );
}

function checkboxAndReset() {
  cy.get("input")
    .last()
    .click({ force: true });
  cy.wait(1000);
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "false",
    "contain.text",
  );
  agHelper.ClickButton("Submit");
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "true",
    "contain.text",
  );
}

function audioWidgetAndReset() {
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "false");
  });
  agHelper.ClickButton("Submit");
}

function audioRecorderWidgetAndReset() {
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "true");
  });
  agHelper.ClickButton("Submit");
}

function phoneInputWidgetAndReset() {
  cy.get(".bp3-input").type("1234");
  cy.wait(1000);
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "1234",
    "contain.text",
  );
  agHelper.ClickButton("Submit");
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "1234",
    "not.have.text",
  );
}

function filePickerWidgetAndReset() {
  agHelper.UploadFile("testFile.mov", false);
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "true",
    "contain.text",
  );
  agHelper.ClickButton("Submit");
  agHelper.GetNAssertElementText(
    locator._textWidgetInDeployed,
    "false",
    "contain.text",
  );
}

Object.entries(widgetsToTest).forEach(([widgetSelector, testConfig]) => {
  describe(`${testConfig.widgetName} widget test for validating reset assertWidgetReset`, () => {
    before(() => {
      cy.fixture("defaultMetaDsl").then((val: any) => {
        agHelper.AddDsl(val);
      });
    });

    it(`1. DragDrop Widget ${testConfig.widgetName}`, () => {
      ee.DragDropWidgetNVerify(widgetSelector, 300, 100);
    });

    it("2. Bind Button on click  and Text widget content", () => {
      // Set onClick assertWidgetReset, storing value
      ee.SelectEntityByName("Button1", "Widgets");
      propPane.EnterJSContext(
        "onClick",
        `{{resetWidget("${testConfig.widgetPrefixName}",true).then(() => showAlert("Reset Success!"))}}`,
      );
      // Bind to stored value above
      ee.SelectEntityByName("Text1");
      propPane.UpdatePropertyFieldValue("Text", testConfig.textBindingValue);
    });

    it("3. Publish the app and check the reset assertWidgetReset", () => {
      // Set onClick assertWidgetReset, storing value
      deployMode.DeployApp();
      testConfig.assertWidgetReset();
      agHelper.AssertContains("Reset Success!");
    });

    it(`4. Delete ${testConfig.widgetName} the widgets on canvas`, () => {
      deployMode.NavigateBacktoEditor();
      ee.SelectEntityByName(`${testConfig.widgetPrefixName}`, "Widgets");
      agHelper.PressDelete();
    });
  });
});
