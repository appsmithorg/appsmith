const dsl = require("../../../../../fixtures/textNewDsl.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

describe("Text Widget Truncate Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check default overflow property is No overflow", function() {
    cy.openPropertyPane("textwidget");
    cy.get(commonlocators.textOverflowDropdown)
      .last()
      .should("have.text", "No overflow");
    cy.closePropertyPane();
  });

  it("Validate long text is not truncating in default", function() {
    cy.get(
      `.appsmith_widget_${dsl.dsl.children[0].widgetId} .t--draggable-textwidget`,
    ).click({
      force: true,
    });

    cy.testJsontext(
      "text",
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    );

    cy.get(
      `.appsmith_widget_${dsl.dsl.children[0].widgetId} .t--widget-textwidget-truncate`,
    ).should("not.exist");
  });

  it("Enable Truncate Text option and Validate", function() {
    cy.selectDropdownValue(
      commonlocators.textOverflowDropdown,
      "Truncate text",
    );
    cy.get(commonlocators.textOverflowDropdown)
      .last()
      .should("have.text", "Truncate text");
    cy.wait("@updateLayout");
    cy.get(
      `.appsmith_widget_${dsl.dsl.children[0].widgetId} .t--widget-textwidget-truncate`,
    ).should("exist");
    cy.closePropertyPane();
  });

  it("Open modal on click and Validate", function() {
    cy.get(
      `.appsmith_widget_${dsl.dsl.children[0].widgetId} .t--widget-textwidget-truncate`,
    ).click();

    cy.get(".t--widget-textwidget-truncate-modal").should("exist");
    // close modal
    cy.get(".t--widget-textwidget-truncate-modal span[name='cross']").click({
      force: true,
    });
  });

  it("Add Long Text to large text box and validate", function() {
    cy.get(
      `.appsmith_widget_${dsl.dsl.children[1].widgetId} .t--draggable-textwidget`,
    ).click({
      force: true,
    });
    cy.wait(200);

    cy.testJsontext(
      "text",
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    );

    cy.get(
      `.appsmith_widget_${dsl.dsl.children[1].widgetId} .t--widget-textwidget-truncate`,
    ).should("not.exist");
  });

  afterEach(() => {
    //
  });
});
