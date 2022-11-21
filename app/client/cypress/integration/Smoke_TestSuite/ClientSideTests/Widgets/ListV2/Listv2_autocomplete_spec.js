const level3NestedList = require("../../../../../fixtures/Listv2/level3NestedList.json");

function checkAutosuggestion(label, type) {
  cy.get(".CodeMirror-hints")
    .contains(label)
    .then(($el) => {
      const after = getComputedStyle($el[0], "::after");
      const afterContent = after.getPropertyValue("content");
      expect(afterContent).eq(`"${type}"`);
    });
}

describe("List v2 - Property autocomplete", () => {
  before(() => {
    cy.addDsl(level3NestedList);
  });

  it("1. shows autocomplete for currentItem/currentIndex/currentRow for level_1 list", () => {
    // Open the property pane of level 1 list widget's Text widget
    cy.openPropertyPaneByWidgetName("Text1", "textwidget");

    cy.testJsontext("text", "");
    cy.get(".t--property-control-text .CodeMirror textarea").type("{{curr", {
      force: true,
    });
    checkAutosuggestion("currentItem", "Object");
    checkAutosuggestion("currentRow", "Object");
    checkAutosuggestion("currentIndex", "Number");
  });

  it("2. shows autocomplete for currentItem/currentIndex/currentRow for level_2 list", () => {
    // Open the property pane of level 2 list widget's Text widget
    cy.openPropertyPaneByWidgetName("Text3", "textwidget");

    cy.testJsontext("text", "");
    cy.get(".t--property-control-text .CodeMirror textarea").type("{{curr", {
      force: true,
    });
    checkAutosuggestion("currentItem", "Object");
    checkAutosuggestion("currentRow", "Object");
    checkAutosuggestion("currentIndex", "Number");
  });

  it("3. shows autocomplete for level_1's currentItem/currentIndex/currentRow for level_2 list", () => {
    // Open the property pane of level 2 list widget's Text widget
    cy.openPropertyPaneByWidgetName("Text3", "textwidget");

    cy.testJsontext("text", "");
    cy.get(".t--property-control-text .CodeMirror textarea").type(
      "{{level_1.",
      { force: true },
    );
    checkAutosuggestion("currentItem", "Object");
    checkAutosuggestion("currentRow", "Object");
    checkAutosuggestion("currentIndex", "Number");
  });

  it("4. shows autocomplete for currentItem/currentIndex/currentRow for level_3 list", () => {
    // Open the property pane of level 3 list widget's Text widget
    cy.openPropertyPaneByWidgetName("Text6", "textwidget");

    cy.testJsontext("text", "");
    cy.get(".t--property-control-text .CodeMirror textarea").type("{{curr", {
      force: true,
    });
    checkAutosuggestion("currentItem", "Object");
    checkAutosuggestion("currentRow", "Object");
    checkAutosuggestion("currentIndex", "Number");
  });

  it("5. shows autocomplete for level_1's currentItem/currentIndex/currentRow for level_3 list", () => {
    // Open the property pane of level 3 list widget's Text widget
    cy.openPropertyPaneByWidgetName("Text6", "textwidget");

    cy.testJsontext("text", "");
    cy.get(".t--property-control-text .CodeMirror textarea").type(
      "{{level_1.",
      { force: true },
    );
    checkAutosuggestion("currentItem", "Object");
    checkAutosuggestion("currentRow", "Object");
    checkAutosuggestion("currentIndex", "Number");
  });

  it("6. shows autocomplete for level_2's currentItem/currentIndex/currentRow for level_3 list", () => {
    // Open the property pane of level 3 list widget's Text widget
    cy.openPropertyPaneByWidgetName("Text6", "textwidget");

    cy.testJsontext("text", "");
    cy.get(".t--property-control-text .CodeMirror textarea").type(
      "{{level_2.",
      { force: true },
    );
    checkAutosuggestion("currentItem", "Object");
    checkAutosuggestion("currentRow", "Object");
    checkAutosuggestion("currentIndex", "Number");
  });

  it("7. should not show List's currentViewItems in currentRow of level_1/level_2 properties", () => {
    // Open the property pane of level 3 list widget's Text widget
    cy.openPropertyPaneByWidgetName("Text6", "textwidget");

    // level_1 List currentViewItems should not exist
    cy.testJsontext("text", "");
    cy.get(
      ".t--property-control-text .CodeMirror textarea",
    ).type("{{level_1.currentRow.List5.", { force: true });
    cy.get(".CodeMirror-hints")
      .contains("currentViewItems")
      .should("not.exist");

    // level_2 List currentViewItems should not exist
    cy.testJsontext("text", "");
    cy.get(
      ".t--property-control-text .CodeMirror textarea",
    ).type("{{level_2.currentRow.List6.", { force: true });
    cy.get(".CodeMirror-hints")
      .contains("currentViewItems")
      .should("not.exist");
  });

  it("8. currentItem should reflect appropriate data types", () => {
    // Open the property pane of level 1 list widget's Text widget
    cy.openPropertyPaneByWidgetName("Text1", "textwidget");

    cy.testJsontext("text", "");
    cy.get(
      ".t--property-control-text .CodeMirror textarea",
    ).type("{{currentItem.", { force: true });
    checkAutosuggestion("companyName", "String");
    checkAutosuggestion("id", "Number");
    checkAutosuggestion("location", "String");
    checkAutosuggestion("positions", "Array");
  });

  it("9. currentRow should reflect appropriate widgets for level_1 for level_3 list", () => {
    // Open the property pane of level 3 list widget's Text widget
    cy.openPropertyPaneByWidgetName("Text6", "textwidget");

    // level_1.currentRow
    cy.testJsontext("text", "");
    cy.get(
      ".t--property-control-text .CodeMirror textarea",
    ).type("{{level_1.currentRow.", { force: true });
    checkAutosuggestion("Text1", "Object");
    checkAutosuggestion("Text2", "Object");
    checkAutosuggestion("List5", "Object");

    // level_1.currentRow.Text1
    cy.testJsontext("text", "");
    cy.get(
      ".t--property-control-text .CodeMirror textarea",
    ).type("{{level_1.currentRow.Text1.", { force: true });
    checkAutosuggestion("text", "String");
    checkAutosuggestion("isVisible", "Boolean");

    // level_1.currentRow.Text2
    cy.testJsontext("text", "");
    cy.get(
      ".t--property-control-text .CodeMirror textarea",
    ).type("{{level_1.currentRow.Text2.", { force: true });
    checkAutosuggestion("text", "String");
    checkAutosuggestion("isVisible", "Boolean");

    // level_1.currentRow.List5
    cy.testJsontext("text", "");
    cy.get(
      ".t--property-control-text .CodeMirror textarea",
    ).type("{{level_1.currentRow.List5.", { force: true });
    checkAutosuggestion("backgroundColor", "String");
    checkAutosuggestion("gridGap", "Number");
    checkAutosuggestion("isVisible", "Boolean");
    checkAutosuggestion("listData", "Array");
    checkAutosuggestion("pageNo", "Number");
    checkAutosuggestion("pageSize", "Number");
    checkAutosuggestion("selectedItem", "Object");
  });
});
