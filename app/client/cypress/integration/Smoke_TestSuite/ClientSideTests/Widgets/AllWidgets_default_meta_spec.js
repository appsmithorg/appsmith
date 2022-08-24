const explorer = require("../../../../locators/explorerlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const dsl = require("../../../../fixtures/defaultMetaDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const homePage = require("../../../../locators/HomePage");

import {
  WIDGET,
  PROPERTY_SELECTOR,
  getWidgetSelector,
  getWidgetInputSelector,
} from "../../../../locators/WidgetLocators";

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

  [WIDGET.LIST]: {
    widgetName: "List",
    widgetPrefixName: "List1",
    textBindingValue: testdata.listBindingValue,
    assertWidgetReset: () => {
      listwidgetAndReset();
    },
  },

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
  /*
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

function dragDropToCanvas(widgetType, { x, y }) {
  const selector = `.t--widget-card-draggable-${widgetType}`;
  cy.wait(500);
  cy.get(selector)
    .trigger("dragstart", { force: true })
    .trigger("mousemove", x, y, { force: true });
  cy.get(explorer.dropHere)
    .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
    .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
    .trigger("mouseup", x, y, { eventConstructor: "MouseEvent" });
}

function PublishApp() {
  // Stubbing window.open to open in the same tab
  cy.window().then((window) => {
    cy.stub(window, "open").callsFake((url) => {
      window.location.href = Cypress.config().baseUrl + url.substring(1);
      window.location.target = "_self";
    });
  });
  cy.get(homePage.publishButton).click();
  cy.wait("@publishApp");
  cy.log("pagename: " + localStorage.getItem("PageName"));
  cy.wait(1000); //wait time for page to load!
}

function chooseColMultiSelectAndReset() {
  cy.get(".rc-select-selection-overflow").click({ force: true });
  cy.get(".rc-select-item-option-content:contains('Blue')").click({
    force: true,
  });
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "BLUE");
  });
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("not.contain.text", "BLUE");
  });
}

function selectTabAndReset() {
  cy.get(".t--tabid-tab2").click({ force: true });
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "Tab 2");
  });
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("not.contain.text", "Tab 2");
  });
}

function selectTableAndReset() {
  cy.isSelectRow(1);
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "#2");
  });
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "#1");
  });
}

function selectSwitchGroupAndReset() {
  cy.get(".bp3-control-indicator")
    .last()
    .click({ force: true });
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "RED");
  });
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("not.contain.text", "RED");
  });
}

function selectSwitchAndReset() {
  cy.get(".bp3-control-indicator")
    .last()
    .click({ force: true });
  cy.get(".t--switch-widget-active").should("not.exist");
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(1000);
  //cy.get(".t--toast-action span").contains("success");
  cy.get(".t--switch-widget-active").should("be.visible");
}

function selectAndReset() {
  cy.get(".select-button").click({ force: true });
  cy.get(".menu-item-text")
    .contains("Blue")
    .click({ force: true });
  cy.wait(3000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "BLUE");
  });
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("not.contain.text", "BLUE");
  });
}

function selectCurrencyInputAndReset() {
  cy.get(".bp3-input")
    .click({ force: true })
    .type("123");
  cy.wait(3000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "123");
  });
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("not.contain.text", "123");
  });
}

function multiTreeSelectAndReset() {
  cy.get(".rc-tree-select-selection-overflow").click({ force: true });
  cy.get(".rc-tree-select-tree-title:contains('Red')").click({
    force: true,
  });
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "RED");
  });
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "GREEN");
  });
}

function radiogroupAndReset() {
  cy.get("input")
    .last()
    .click({ force: true });
  cy.wait(3000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "N");
  });
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "Y");
  });
}

function listwidgetAndReset() {
  cy.get(".t--widget-containerwidget")
    .eq(1)
    .click({ force: true });
  cy.wait(3000);
  cy.get(commonlocators.textWidgetContainer).should("contain.text", "002");
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).should("contain.text", "001");
}

function ratingwidgetAndReset() {
  cy.get(".bp3-icon-star svg")
    .last()
    .click({ force: true });
  cy.wait(3000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("not.contain.text", "3");
  });
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "3");
  });
}

function checkboxGroupAndReset() {
  cy.wait(2000);
  cy.get("[data-cy=checkbox-group-container] > :nth-child(3)")
    .last()
    .should("be.visible")
    .click({ force: true });
  cy.wait(2000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "RED");
  });
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(1000);
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(2000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("not.contain.text", "RED");
  });
}

function checkboxAndReset() {
  cy.get("input")
    .last()
    .click({ force: true });
  cy.wait(3000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "false");
  });
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "true");
  });
}

function audioWidgetAndReset() {
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "false");
  });
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(1000);
}

function audioRecorderWidgetAndReset() {
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "true");
  });
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(1000);
}

function phoneInputWidgetAndReset() {
  cy.get(".bp3-input").type("1234");
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "1234");
  });
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "");
  });
}

function filePickerWidgetAndReset() {
  cy.wait(2000);
  cy.get(".t--widget-filepickerwidgetv2").should("be.visible");
  cy.wait(2000);
  cy.get(commonlocators.filePickerInput)
    .first()
    .attachFile("testFile.mov");
  //eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "true");
  });
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(1000);
  cy.get("button:contains('Submit')").click({ force: true });
  cy.wait(2000);
  cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
    cy.wrap(item).should("contain.text", "false");
  });
}

Object.entries(widgetsToTest).forEach(([widgetSelector, testConfig]) => {
  describe(`${testConfig.widgetName} widget test for validating reset assertWidgetReset`, () => {
    before(() => {
      cy.addDsl(dsl);
    });

    it(`1. DragDrop Widget ${testConfig.widgetName}`, () => {
      cy.get(explorer.addWidget).click();
      dragDropToCanvas(widgetSelector, { x: 300, y: 200 });
      cy.get(getWidgetSelector(widgetSelector)).should("exist");
    });

    it("2. Bind Button on click  and Text widget content", () => {
      // Set onClick assertWidgetReset, storing value
      cy.openPropertyPane(WIDGET.BUTTON);

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

    it("3. Publish the app and check the reset assertWidgetReset", () => {
      // Set onClick assertWidgetReset, storing value
      PublishApp();
      testConfig.assertWidgetReset();
      cy.get(".t--toast-action span").contains("success");
    });

    it("4. Delete all the widgets on canvas", () => {
      cy.goToEditFromPublish();
      cy.get(getWidgetSelector(widgetSelector)).click();
      cy.get("body").type(`{del}`, { force: true });
    });
  });
});
