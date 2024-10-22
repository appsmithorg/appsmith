import testdata from "../../../../fixtures/testdata.json";
import commonlocators from "../../../../locators/commonlocators.json";
import * as _ from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const widgetsToTest: Record<
  string,
  {
    widgetName: string;
    widgetPrefixName: string;
    textBindingValue: string;
    assertWidgetReset: () => void;
    setupWidget?: () => void;
  }
> = {
  [_.draggableWidgets.MULTISELECT]: {
    widgetName: "MultiSelect",
    widgetPrefixName: "MultiSelect1",
    textBindingValue: "{{MultiSelect1.selectedOptionValues}}",
    assertWidgetReset: () => {
      chooseColMultiSelectAndReset();
    },
  },
  [_.draggableWidgets.TAB]: {
    widgetName: "Tab",
    widgetPrefixName: "Tabs1",
    textBindingValue: testdata.tabBindingValue,
    assertWidgetReset: () => {
      selectTabAndReset();
    },
  },
  [_.draggableWidgets.TABLE]: {
    widgetName: "Table",
    widgetPrefixName: "Table1",
    textBindingValue: testdata.tableBindingValue,
    assertWidgetReset: () => {
      selectTableAndReset();
    },
    setupWidget: () => {
      _.table.AddSampleTableData();
    },
  },
  [_.draggableWidgets.SWITCHGROUP]: {
    widgetName: "SwitchGroup",
    widgetPrefixName: "SwitchGroup1",
    textBindingValue: testdata.switchGroupBindingValue,
    assertWidgetReset: () => {
      selectSwitchGroupAndReset();
    },
  },
  [_.draggableWidgets.SWITCH]: {
    widgetName: "Switch",
    widgetPrefixName: "Switch1",
    textBindingValue: testdata.switchBindingValue,
    assertWidgetReset: () => {
      selectSwitchAndReset();
    },
  },
  [_.draggableWidgets.SELECT]: {
    widgetName: "Select",
    widgetPrefixName: "Select1",
    textBindingValue: testdata.selectBindingValue,
    assertWidgetReset: () => {
      selectAndReset();
    },
  },
  [_.draggableWidgets.CURRENCY_INPUT]: {
    widgetName: "CurrencyInput",
    widgetPrefixName: "CurrencyInput1",
    textBindingValue: testdata.currencyBindingValue,
    assertWidgetReset: () => {
      selectCurrencyInputAndReset();
    },
  },
  [_.draggableWidgets.MULTITREESELECT]: {
    widgetName: "MultiTreeSelect",
    widgetPrefixName: "MultiTreeSelect1",
    textBindingValue: testdata.multitreeselectBindingValue,
    assertWidgetReset: () => {
      multiTreeSelectAndReset();
    },
  },
  [_.draggableWidgets.RADIO_GROUP]: {
    widgetName: "RadioGroup",
    widgetPrefixName: "RadioGroup1",
    textBindingValue: testdata.radiogroupselectBindingValue,
    assertWidgetReset: () => {
      radiogroupAndReset();
    },
  },
  // [_.draggableWidgets.LIST]: {//Open bug hence commenting List widget #16578, #14727
  //   widgetName: "List",
  //   widgetPrefixName: "List1",
  //   textBindingValue: testdata.listBindingValue,
  //   assertWidgetReset: () => {
  //     listwidgetAndReset();
  //   },
  // },
  [_.draggableWidgets.RATING]: {
    widgetName: "Rating",
    widgetPrefixName: "Rating1",
    textBindingValue: testdata.ratingBindingValue,
    assertWidgetReset: () => {
      ratingwidgetAndReset();
    },
  },
  [_.draggableWidgets.CHECKBOXGROUP]: {
    widgetName: "CheckboxGroup",
    widgetPrefixName: "CheckboxGroup1",
    textBindingValue: testdata.checkboxGroupBindingValue,
    assertWidgetReset: () => {
      checkboxGroupAndReset();
    },
  },
  [_.draggableWidgets.CHECKBOX]: {
    widgetName: "Checkbox",
    widgetPrefixName: "Checkbox1",
    textBindingValue: testdata.checkboxBindingValue,
    assertWidgetReset: () => {
      checkboxAndReset();
    },
  },
  /*Open bug # 14692 - hence commenting
  [_.draggableWidgets.AUDIO]: {
    widgetName: "Audio",
    widgetPrefixName: "Audio1",
    textBindingValue: testdata.audioBindingValue,
    assertWidgetReset: () => {
      audioWidgetAndReset();
    },
  },
  [_.draggableWidgets.AUDIORECORDER]: {
    widgetName: "AudioRecorder",
    widgetPrefixName: "AudioRecorder1",
    textBindingValue: testdata.audioRecorderBindingValue,
    assertWidgetReset: () => {
      audioRecorderWidgetAndReset();
    },
  },
  */
  [_.draggableWidgets.PHONE_INPUT]: {
    widgetName: "PhoneInput",
    widgetPrefixName: "PhoneInput1",
    textBindingValue: testdata.phoneBindingValue,
    assertWidgetReset: () => {
      phoneInputWidgetAndReset();
    },
  },
  [_.draggableWidgets.FILEPICKER]: {
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
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "BLUE",
    "contain.text",
  );
  _.agHelper.ClickButton("Submit");
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "BLUE",
    "not.have.text",
  );
}

function selectTabAndReset() {
  cy.get(".t--tabid-tab2").click({ force: true });
  cy.wait(1000);
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "Tab 2",
    "contain.text",
  );
  _.agHelper.ClickButton("Submit");
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "Tab 2",
    "not.have.text",
  );
}

function selectTableAndReset() {
  _.table.SelectTableRow(1, 0, true, "v2");
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "#2",
    "contain.text",
  );
  _.agHelper.ClickButton("Submit");
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "#1",
    "contain.text",
  );
}

function selectSwitchGroupAndReset() {
  _.agHelper.CheckUncheck(_.locators._checkboxTypeByOption("Red"));
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "RED",
    "contain.text",
  );
  _.agHelper.ClickButton("Submit");
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "RED",
    "not.have.text",
  );
}

function selectSwitchAndReset() {
  cy.get(".bp3-control-indicator").last().click({ force: true });
  cy.get(".t--switch-widget-active").should("not.exist");
  _.agHelper.ClickButton("Submit");
  cy.get(".t--switch-widget-active").should("be.visible");
}

function selectAndReset() {
  cy.get(".select-button").click({ force: true });
  cy.get(".menu-item-text").contains("Blue").click({ force: true });
  cy.wait(1000);
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "BLUE",
    "contain.text",
  );
  _.agHelper.ClickButton("Submit");
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "BLUE",
    "not.have.text",
  );
}

function selectCurrencyInputAndReset() {
  cy.get(".bp3-input").click({ force: true }).type("123");
  cy.wait(1000);
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "123",
    "contain.text",
  );
  _.agHelper.ClickButton("Submit");
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
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
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "RED",
    "contain.text",
  );
  _.agHelper.ClickButton("Submit");
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "GREEN",
    "contain.text",
  );
}

function radiogroupAndReset() {
  _.agHelper.GetNClick("input", 1, true, 1000);
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "N",
    "contain.text",
  );
  _.agHelper.ClickButton("Submit");
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "Y",
    "contain.text",
  );
}

function listwidgetAndReset() {
  _.agHelper.Sleep();
  _.agHelper.GetNClick(".t--widget-containerwidget", 1, true, 2000);
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "002",
    "contain.text",
    6,
  );
  _.agHelper.ClickButton("Submit");
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "001",
    "contain.text",
    6,
  );
}

function ratingwidgetAndReset() {
  cy.get(".bp3-icon-star svg").last().click({ force: true });
  cy.wait(1000);
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "3",
    "not.have.text",
  );
  _.agHelper.ClickButton("Submit");
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "3",
    "contain.text",
  );
}

function checkboxGroupAndReset() {
  cy.wait(2000);
  cy.get("[data-testid=checkbox-group-container] > :nth-child(3)")
    .last()
    .should("be.visible")
    .click({ force: true });
  cy.wait(1000);
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "RED",
    "contain.text",
  );
  _.agHelper.ClickButton("Submit");
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "RED",
    "not.have.text",
  );
}

function checkboxAndReset() {
  _.agHelper.GetNClick("input", 0, true, 1000);
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "false",
    "contain.text",
  );
  _.agHelper.ClickButton("Submit");
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "true",
    "contain.text",
  );
}

function audioWidgetAndReset() {
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "false");
  });
  _.agHelper.ClickButton("Submit");
}

function audioRecorderWidgetAndReset() {
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "true");
  });
  _.agHelper.ClickButton("Submit");
}

function phoneInputWidgetAndReset() {
  cy.get(".bp3-input").type("1234");
  cy.wait(1000);
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "1234",
    "contain.text",
  );
  _.agHelper.ClickButton("Submit");
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "1234",
    "not.have.text",
  );
}

function filePickerWidgetAndReset() {
  _.agHelper.UploadFile("testFile.mov", false);
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "true",
    "contain.text",
  );
  _.agHelper.ClickButton("Submit");
  _.agHelper.GetNAssertElementText(
    _.locators._textWidgetInDeployed,
    "false",
    "contain.text",
  );
}

Object.entries(widgetsToTest).forEach(([widgetSelector, testConfig]) => {
  describe(
    `${testConfig.widgetName} widget test for validating reset assertWidgetReset`,
    { tags: ["@tag.Widget", "@tag.Sanity", "@tag.Binding"] },
    () => {
      beforeEach(() => {
        _.agHelper.RestoreLocalStorageCache();
      });

      afterEach(() => {
        _.agHelper.SaveLocalStorageCache();
      });

      it(`1. DragDrop Widget ${testConfig.widgetName}`, () => {
        _.agHelper.AddDsl("defaultMetaDsl");
        _.entityExplorer.DragDropWidgetNVerify(widgetSelector, 300, 100);

        if (testConfig.setupWidget) {
          testConfig.setupWidget();
        }
      });

      it("2. Bind Button on click  and Text widget content", () => {
        // Set onClick assertWidgetReset, storing value
        EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
        _.propPane.EnterJSContext(
          "onClick",
          `{{resetWidget("${testConfig.widgetPrefixName}",true).then(() => showAlert("Reset Success!"))}}`,
        );
        // Bind to stored value above
        EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
        _.propPane.UpdatePropertyFieldValue(
          "Text",
          testConfig.textBindingValue,
        );
      });

      it(`3. Publish the app and check the reset of ${testConfig.widgetName}`, () => {
        // Set onClick assertWidgetReset, storing value
        _.deployMode.DeployApp(_.locators._widgetInDeployed(widgetSelector));
        testConfig.assertWidgetReset();
        _.agHelper.ValidateToastMessage("Reset Success!");
      });

      it(`4. Delete ${testConfig.widgetName} widget from canvas`, () => {
        _.deployMode.NavigateBacktoEditor();
        EditorNavigation.SelectEntityByName(
          `${testConfig.widgetPrefixName}`,
          EntityType.Widget,
        );
        _.agHelper.PressDelete();
      });
    },
  );
});
