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

xdescribe(`Table widget test for validating reset action`, () => {
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
    cy.get(getWidgetSelector(WIDGET.TAB)).click();
    cy.get("body").type(`{del}`, { force: true });
  });
});

describe(`Table widget test for validating reset action`, () => {
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
      cy.wrap(item).should("contain.text", "#1");
    });
    cy.get("button:contains('Submit')").click({ force: true });
    cy.wait(1000);
    cy.get(".t--text-widget-container").each((item, index, list) => {
      cy.wrap(item).should("not.contain.text", "#1");
    });
    cy.get(".t--toast-action span").contains("success");
  });

  it("4. Delete all the widgets on canvas", () => {
    cy.get(getWidgetSelector(WIDGET.TAB)).click();
    cy.get("body").type(`{del}`, { force: true });
  });
});
