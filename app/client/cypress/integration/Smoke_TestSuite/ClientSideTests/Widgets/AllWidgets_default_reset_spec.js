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

xdescribe(`TresSelect widget test for validating reset action`, () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it(`1. DragDrop Widget TreeSelect`, () => {
    cy.get(explorer.addWidget).click({ force: true });
    cy.dragAndDropToCanvas(WIDGET.TREESELECT_WIDGET, { x: 300, y: 200 });
    cy.get(getWidgetSelector(WIDGET.TREESELECT_WIDGET)).should("exist");
  });

  it("2. Bind Button on click  and Text widget content", () => {
    // Set onClick action, storing value
    cy.openPropertyPane(WIDGET.BUTTON_WIDGET);

    cy.get(PROPERTY_SELECTOR.onClick)
      .find(".t--js-toggle")
      .click();
    cy.updateCodeInput(
      PROPERTY_SELECTOR.onClick,
      `{{resetWidget("TreeSelect1",true).then(() => showAlert("success"))}}`,
    );
    // Bind to stored value above
    cy.openPropertyPane(WIDGET.TEXT);
    cy.updateCodeInput(PROPERTY_SELECTOR.text, testdata.treeTextBindingValue);
    cy.closePropertyPane();

    cy.get(getWidgetSelector(WIDGET.BUTTON_WIDGET)).click();
    cy.wait("@updateLayout");
    cy.get(".t--toast-action span").contains("success");
  });

  it("3. Publish the app and validate reset action", function() {
    cy.PublishtheApp();
    cy.get(".rc-tree-select-selection-item").click({ force: true });
    cy.get(".rc-tree-select-tree-title:contains('Green')").click({
      force: true,
    });
    cy.wait(1000);
    cy.get("button:contains('Submit')").click({ force: true });
    cy.wait(1000);
    cy.get(".t--text-widget-container").each((item, index, list) => {
      cy.wrap(item).should("not.contain.text", "Green");
    });
    cy.get(".t--toast-action span").contains("success");
  });

  it("4. Delete all the widgets on canvas", () => {
    cy.goToEditFromPublish();
    cy.get(getWidgetSelector(WIDGET.TREESELECT_WIDGET)).click();
    cy.get("body").type(`{del}`, { force: true });
  });
});

xdescribe(`Tab widget test for validating reset action`, () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it(`1. DragDrop Widget TAB`, () => {
    cy.get(explorer.addWidget).click({ force: true });
    cy.dragAndDropToCanvas(WIDGET.TAB, { x: 300, y: 200 });
    cy.get(getWidgetSelector(WIDGET.TAB)).should("exist");
  });

  it("2. Bind Button on click  and Text widget content", () => {
    // Set onClick action, storing value
    cy.openPropertyPane(WIDGET.BUTTON_WIDGET);

    cy.get(PROPERTY_SELECTOR.onClick)
      .find(".t--js-toggle")
      .click();
    cy.updateCodeInput(
      PROPERTY_SELECTOR.onClick,
      `{{resetWidget("Tabs1",true).then(() => showAlert("success"))}}`,
    );
    cy.openPropertyPane(WIDGET.TEXT);
    cy.updateCodeInput(PROPERTY_SELECTOR.text, testdata.tabBindingValue);
    cy.closePropertyPane();

    cy.get(getWidgetSelector(WIDGET.BUTTON_WIDGET)).click();
    cy.wait("@updateLayout");
    cy.get(".t--toast-action span").contains("success");
  });

  it("3. Publish the app and validate reset action", function() {
    cy.PublishtheApp();
    cy.get(".t--tabid-tab2").click({ force: true });
    cy.wait(1000);
    cy.get(".t--text-widget-container").each((item, index, list) => {
      cy.wrap(item).should("contain.text", "TAB2");
    });
    cy.get("button:contains('Submit')").click({ force: true });
    cy.wait(1000);
    cy.get(".t--text-widget-container").each((item, index, list) => {
      cy.wrap(item).should("not.contain.text", "TAB2");
    });
    cy.get(".t--toast-action span").contains("success");
  });

  it("4. Delete all the widgets on canvas", () => {
    cy.goToEditFromPublish();
    cy.get(getWidgetSelector(WIDGET.TAB)).click();
    cy.get("body").type(`{del}`, { force: true });
  });
});

xdescribe(`Table widget test for validating reset action`, () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it(`1. DragDrop Widget Table`, () => {
    cy.get(explorer.addWidget).click({ force: true });
    cy.dragAndDropToCanvas(WIDGET.TABLE, { x: 300, y: 200 });
    cy.get(getWidgetSelector(WIDGET.TABLE)).should("exist");
  });

  it("2. Bind Button on click  and Text widget content", () => {
    // Set onClick action, storing value
    cy.openPropertyPane(WIDGET.BUTTON_WIDGET);

    cy.get(PROPERTY_SELECTOR.onClick)
      .find(".t--js-toggle")
      .click();
    cy.updateCodeInput(
      PROPERTY_SELECTOR.onClick,
      `{{resetWidget("Table1",true).then(() => showAlert("success"))}}`,
    );
    cy.openPropertyPane(WIDGET.TEXT);
    cy.updateCodeInput(PROPERTY_SELECTOR.text, testdata.tableBindingValue);
    cy.closePropertyPane();

    cy.get(getWidgetSelector(WIDGET.BUTTON_WIDGET)).click();
    cy.wait("@updateLayout");
    cy.get(".t--toast-action span").contains("success");
  });

  it("3. Publish the app and validate reset action", function() {
    cy.PublishtheApp();
    cy.isSelectRow(1);
    cy.wait(1000);
    cy.get(".t--text-widget-container").each((item, index, list) => {
      cy.wrap(item).should("contain.text", "#2");
    });
    cy.get("button:contains('Submit')").click({ force: true });
    cy.wait(1000);
    cy.get(".t--text-widget-container").each((item, index, list) => {
      cy.wrap(item).should("contain.text", "#1");
    });
    cy.get(".t--toast-action span").contains("success");
  });

  it("4. Delete all the widgets on canvas", () => {
    cy.goToEditFromPublish();
    cy.get(getWidgetSelector(WIDGET.TABLE)).click();
    cy.get("body").type(`{del}`, { force: true });
  });
});
xdescribe(`Switch Group widget test for validating reset action`, () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it(`1. DragDrop Widget Switch Group`, () => {
    cy.get(explorer.addWidget).click({ force: true });
    cy.dragAndDropToCanvas(WIDGET.SWITCHGROUP, { x: 300, y: 200 });
    cy.get(getWidgetSelector(WIDGET.SWITCHGROUP)).should("exist");
  });

  it("2. Bind Button on click  and Text widget content", () => {
    // Set onClick action, storing value
    cy.openPropertyPane(WIDGET.BUTTON_WIDGET);

    cy.get(PROPERTY_SELECTOR.onClick)
      .find(".t--js-toggle")
      .click();
    cy.updateCodeInput(
      PROPERTY_SELECTOR.onClick,
      `{{resetWidget("SwitchGroup1",true).then(() => showAlert("success"))}}`,
    );
    cy.openPropertyPane(WIDGET.TEXT);
    cy.updateCodeInput(
      PROPERTY_SELECTOR.text,
      testdata.switchGroupBindingValue,
    );
    cy.closePropertyPane();

    cy.get(getWidgetSelector(WIDGET.BUTTON_WIDGET)).click();
    cy.wait("@updateLayout");
    cy.get(".t--toast-action span").contains("success");
  });

  it("3. Publish the app and validate reset action", function() {
    cy.PublishtheApp();
    cy.get(".bp3-control-indicator")
      .last()
      .click({ force: true });
    cy.get(".t--text-widget-container").each((item, index, list) => {
      cy.wrap(item).should("contain.text", "RED");
    });
    cy.get("button:contains('Submit')").click({ force: true });
    cy.wait(1000);
    cy.get(".t--text-widget-container").each((item, index, list) => {
      cy.wrap(item).should("not.contain.text", "RED");
    });
    cy.get(".t--toast-action span").contains("success");
  });

  it("4. Delete all the widgets on canvas", () => {
    cy.goToEditFromPublish();
    cy.get(getWidgetSelector(WIDGET.SWITCHGROUP)).click();
    cy.get("body").type(`{del}`, { force: true });
  });
});

xdescribe(`Switch widget test for validating reset action`, () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it(`1. DragDrop Widget Switch`, () => {
    cy.get(explorer.addWidget).click({ force: true });
    cy.dragAndDropToCanvas(WIDGET.SWITCH, { x: 300, y: 200 });
    cy.get(getWidgetSelector(WIDGET.SWITCH)).should("exist");
  });

  it("2. Bind Button on click  and Text widget content", () => {
    // Set onClick action, storing value
    cy.openPropertyPane(WIDGET.BUTTON_WIDGET);

    cy.get(PROPERTY_SELECTOR.onClick)
      .find(".t--js-toggle")
      .click();
    cy.updateCodeInput(
      PROPERTY_SELECTOR.onClick,
      `{{resetWidget("Switch1",true).then(() => showAlert("success"))}}`,
    );
    cy.openPropertyPane(WIDGET.TEXT);
    cy.updateCodeInput(PROPERTY_SELECTOR.text, testdata.switchBindingValue);
    cy.closePropertyPane();

    cy.get(getWidgetSelector(WIDGET.BUTTON_WIDGET)).click();
    cy.wait("@updateLayout");
    cy.get(".t--toast-action span").contains("success");
  });

  it("3. Publish the app and validate reset action", function() {
    cy.PublishtheApp();
    cy.get(".bp3-control-indicator")
      .last()
      .click({ force: true });
    cy.get(".t--switch-widget-active").should("not.exist");
    cy.get("button:contains('Submit')").click({ force: true });
    cy.wait(1000);
    cy.get(".t--toast-action span").contains("success");
    cy.get(".t--switch-widget-active").should("be.visible");
  });

  it("4. Delete all the widgets on canvas", () => {
    cy.goToEditFromPublish();
    cy.get(getWidgetSelector(WIDGET.SWITCH)).click();
    cy.get("body").type(`{del}`, { force: true });
  });
});

xdescribe(`Select widget test for validating reset action`, () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it(`1. DragDrop Widget Select`, () => {
    cy.get(explorer.addWidget).click({ force: true });
    cy.dragAndDropToCanvas(WIDGET.SELECT, { x: 300, y: 200 });
    cy.get(getWidgetSelector(WIDGET.SELECT)).should("exist");
  });

  it("2. Bind Button on click  and Text widget content", () => {
    // Set onClick action, storing value
    cy.openPropertyPane(WIDGET.BUTTON_WIDGET);

    cy.get(PROPERTY_SELECTOR.onClick)
      .find(".t--js-toggle")
      .click();
    cy.updateCodeInput(
      PROPERTY_SELECTOR.onClick,
      `{{resetWidget("Select1",true).then(() => showAlert("success"))}}`,
    );
    cy.openPropertyPane(WIDGET.TEXT);
    cy.updateCodeInput(PROPERTY_SELECTOR.text, testdata.selectBindingValue);
    cy.closePropertyPane();

    cy.get(getWidgetSelector(WIDGET.BUTTON_WIDGET)).click();
    cy.wait("@updateLayout");
    cy.get(".t--toast-action span").contains("success");
  });

  it("3. Publish the app and validate reset action", function() {
    cy.PublishtheApp();
    cy.get(".select-button").click({ force: true });
    cy.get(".menu-item-text")
      .contains("Blue")
      .click({ force: true });
    cy.wait(3000);
    cy.get(".t--text-widget-container").each((item, index, list) => {
      cy.wrap(item).should("contain.text", "BLUE");
    });
    cy.get("button:contains('Submit')").click({ force: true });
    cy.wait(1000);
    cy.get(".t--text-widget-container").each((item, index, list) => {
      cy.wrap(item).should("not.contain.text", "BLUE");
    });
    cy.get(".t--toast-action span").contains("success");
  });

  it("4. Delete all the widgets on canvas", () => {
    cy.goToEditFromPublish();
    cy.get(getWidgetSelector(WIDGET.SELECT)).click();
    cy.get("body").type(`{del}`, { force: true });
  });
});

xdescribe(`CurrencyInput widget test for validating reset action`, () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it(`1. DragDrop Widget CurrencyInut`, () => {
    cy.get(explorer.addWidget).click({ force: true });
    cy.dragAndDropToCanvas(WIDGET.CURRENCY_INPUT_WIDGET, { x: 300, y: 200 });
    cy.get(getWidgetSelector(WIDGET.CURRENCY_INPUT_WIDGET)).should("exist");
  });

  it("2. Bind Button on click  and Text widget content", () => {
    // Set onClick action, storing value
    cy.openPropertyPane(WIDGET.BUTTON_WIDGET);

    cy.get(PROPERTY_SELECTOR.onClick)
      .find(".t--js-toggle")
      .click();
    cy.updateCodeInput(
      PROPERTY_SELECTOR.onClick,
      `{{resetWidget("CurrencyInput1",true).then(() => showAlert("success"))}}`,
    );
    cy.openPropertyPane(WIDGET.TEXT);
    cy.updateCodeInput(PROPERTY_SELECTOR.text, testdata.currencyBindingValue);
    cy.closePropertyPane();

    cy.get(getWidgetSelector(WIDGET.BUTTON_WIDGET)).click();
    cy.wait("@updateLayout");
    cy.get(".t--toast-action span").contains("success");
  });

  it("3. Publish the app and validate reset action", function() {
    cy.PublishtheApp();
    cy.get(".bp3-input")
      .click({ force: true })
      .type("123")
    cy.wait(3000);
    cy.get(".t--text-widget-container").each((item, index, list) => {
      cy.wrap(item).should("contain.text", "123");
    });
    cy.get("button:contains('Submit')").click({ force: true });
    cy.wait(1000);
    cy.get(".t--text-widget-container").each((item, index, list) => {
      cy.wrap(item).should("not.contain.text", "123");
    });
    cy.get(".t--toast-action span").contains("success");
  });

  it("4. Delete all the widgets on canvas", () => {
    cy.goToEditFromPublish();
    cy.get(getWidgetSelector(WIDGET.CURRENCY_INPUT_WIDGET)).click();
    cy.get("body").type(`{del}`, { force: true });
  });
});

describe(`MultiTreeSelect widget test for validating reset action`, () => {
    before(() => {
      cy.addDsl(dsl);
    });
  
    it(`1. DragDrop Widget MultiTreeSelect `, () => {
      cy.get(explorer.addWidget).click({ force: true });
      cy.dragAndDropToCanvas(WIDGET.MULTITREESELECT, { x: 300, y: 200 });
      cy.get(getWidgetSelector(WIDGET.MULTITREESELECT)).should("exist");
    });
  
    it("2. Bind Button on click  and Text widget content", () => {
      // Set onClick action, storing value
      cy.openPropertyPane(WIDGET.BUTTON_WIDGET);
  
      cy.get(PROPERTY_SELECTOR.onClick)
        .find(".t--js-toggle")
        .click();
      cy.updateCodeInput(
        PROPERTY_SELECTOR.onClick,
        `{{resetWidget("MultiTreeSelect1",true).then(() => showAlert("success"))}}`,
      );
      cy.openPropertyPane(WIDGET.TEXT);
      cy.updateCodeInput(PROPERTY_SELECTOR.text, testdata.multitreeselectBindingValue);
      cy.closePropertyPane();
  
      cy.get(getWidgetSelector(WIDGET.BUTTON_WIDGET)).click();
      cy.wait("@updateLayout");
      cy.get(".t--toast-action span").contains("success");
    });
  
    it("3. Publish the app and validate reset action", function() {
      cy.PublishtheApp();
      cy.get(".select-button").click({ force: true });
      cy.get(".bp3-input")
        .click({ force: true })
        .type("123")
      cy.wait(3000);
      cy.get(".t--text-widget-container").each((item, index, list) => {
        cy.wrap(item).should("contain.text", "123");
      });
      cy.get("button:contains('Submit')").click({ force: true });
      cy.wait(1000);
      cy.get(".t--text-widget-container").each((item, index, list) => {
        cy.wrap(item).should("not.contain.text", "");
      });
      cy.get(".t--toast-action span").contains("success");
    });
  
    it("4. Delete all the widgets on canvas", () => {
      cy.goToEditFromPublish();
      cy.get(getWidgetSelector(WIDGET.MULTITREESELECT)).click();
      cy.get("body").type(`{del}`, { force: true });
    });
  });

  xdescribe(`RadioGroup widget test for validating reset action`, () => {
    before(() => {
      cy.addDsl(dsl);
    });
  
    it(`1. DragDrop Widget RadioGroup `, () => {
      cy.get(explorer.addWidget).click({ force: true });
      cy.dragAndDropToCanvas(WIDGET.RADIO_GROUP, { x: 300, y: 200 });
      cy.get(getWidgetSelector(WIDGET.RADIO_GROUP)).should("exist");
    });
  
    it("2. Bind Button on click  and Text widget content", () => {
      // Set onClick action, storing value
      cy.openPropertyPane(WIDGET.BUTTON_WIDGET);
  
      cy.get(PROPERTY_SELECTOR.onClick)
        .find(".t--js-toggle")
        .click();
      cy.updateCodeInput(
        PROPERTY_SELECTOR.onClick,
        `{{resetWidget("RadioGroup1",true).then(() => showAlert("success"))}}`,
      );
      cy.openPropertyPane(WIDGET.TEXT);
      cy.updateCodeInput(PROPERTY_SELECTOR.text, testdata.radiogroupselectBindingValue);
      cy.closePropertyPane();
  
      cy.get(getWidgetSelector(WIDGET.BUTTON_WIDGET)).click();
      cy.wait("@updateLayout");
      cy.get(".t--toast-action span").contains("success");
    });
  
    it("3. Publish the app and validate reset action", function() {
      cy.PublishtheApp();
      cy.get(".select-button").click({ force: true });
      cy.get(".bp3-input")
        .click({ force: true })
        .type("123")
      cy.wait(3000);
      cy.get(".t--text-widget-container").each((item, index, list) => {
        cy.wrap(item).should("contain.text", "123");
      });
      cy.get("button:contains('Submit')").click({ force: true });
      cy.wait(1000);
      cy.get(".t--text-widget-container").each((item, index, list) => {
        cy.wrap(item).should("not.contain.text", "");
      });
      cy.get(".t--toast-action span").contains("success");
    });
  
    it("4. Delete all the widgets on canvas", () => {
      cy.goToEditFromPublish();
      cy.get(getWidgetSelector(WIDGET.RADIO_GROUP)).click();
      cy.get("body").type(`{del}`, { force: true });
    });
  });

  xdescribe(`List widget test for validating reset action`, () => {
    before(() => {
      cy.addDsl(dsl);
    });
  
    it(`1. DragDrop Widget List `, () => {
      cy.get(explorer.addWidget).click({ force: true });
      cy.dragAndDropToCanvas(WIDGET.LIST, { x: 300, y: 200 });
      cy.get(getWidgetSelector(WIDGET.LIST)).should("exist");
    });
  
    it("2. Bind Button on click  and Text widget content", () => {
      // Set onClick action, storing value
      cy.openPropertyPane(WIDGET.BUTTON_WIDGET);
  
      cy.get(PROPERTY_SELECTOR.onClick)
        .find(".t--js-toggle")
        .click();
      cy.updateCodeInput(
        PROPERTY_SELECTOR.onClick,
        `{{resetWidget("List1",true).then(() => showAlert("success"))}}`,
      );
      cy.openPropertyPane(WIDGET.TEXT);
      cy.updateCodeInput(PROPERTY_SELECTOR.text, testdata.listBindingValue);
      cy.closePropertyPane();
  
      cy.get(getWidgetSelector(WIDGET.BUTTON_WIDGET)).click();
      cy.wait("@updateLayout");
      cy.get(".t--toast-action span").contains("success");
    });
  
    it("3. Publish the app and validate reset action", function() {
      cy.PublishtheApp();
      cy.get(".select-button").click({ force: true });
      cy.get(".bp3-input")
        .click({ force: true })
        .type("123")
      cy.wait(3000);
      cy.get(".t--text-widget-container").each((item, index, list) => {
        cy.wrap(item).should("contain.text", "123");
      });
      cy.get("button:contains('Submit')").click({ force: true });
      cy.wait(1000);
      cy.get(".t--text-widget-container").each((item, index, list) => {
        cy.wrap(item).should("not.contain.text", "");
      });
      cy.get(".t--toast-action span").contains("success");
    });
  
    it("4. Delete all the widgets on canvas", () => {
      cy.goToEditFromPublish();
      cy.get(getWidgetSelector(WIDGET.LIST)).click();
      cy.get("body").type(`{del}`, { force: true });
    });
  });