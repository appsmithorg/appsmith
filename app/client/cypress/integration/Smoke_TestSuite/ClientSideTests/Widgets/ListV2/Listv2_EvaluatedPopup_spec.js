describe("List widget v2 Evaluated Popup", () => {
  it("1. List widget V2 with currentItem and escape characters", () => {
    cy.dragAndDropToCanvas("listwidgetv2", {
      x: 300,
      y: 300,
    });
    cy.openPropertyPaneByWidgetName("Text1", "textwidget");

    [
      ["{{currentItem.name}}", "Blue"],
      ["{{currentItem.id}}", "001"],
      ["{{currentItem.name}}_{{currentIndex}}", "Blue_0"],
      ["{{1000}}", "1000"],
      ['{{(() => "Text Widget")()}}', "Text Widget"],
      ["NewLine\n{{currentItem.name}}", "NewLine\nBlue"],
      [`\{{currentItem.name}}`, `\Blue`],
      [
        `{{
          (function(){return true;})
          ()}}
        `,
        "true",
      ],
    ].forEach(([input, expected]) => {
      cy.updateCodeInput(".t--property-control-text", input);
      cy.wait(500);
      cy.validateEvaluatedValue(expected);
    });
  });

  it("2. List widget V2 with error input", () => {
    cy.openPropertyPaneByWidgetName("Text1", "textwidget");

    [
      ["{{currentItem}}", "This value does not evaluate to type string"],
      ["{{Text}}", "ReferenceError: Text is not defined"],
    ].forEach(([input, expected]) => {
      cy.updateCodeInput(".t--property-control-text", input);
      cy.wait(500);
      cy.evaluateErrorMessage(expected);
    });
  });
});
