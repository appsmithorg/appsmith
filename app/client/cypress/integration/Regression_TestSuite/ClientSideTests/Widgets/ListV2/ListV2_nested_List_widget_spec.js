const dsl = require("../../../../../fixtures/Listv2/copy_paste_listv2_dsl.json");
const nestedSiblingDsl = require("../../../../../fixtures/Listv2/ListV2_nested_sibling_listwidget_dsl.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;
let agHelper = ObjectsRegistry.AggregateHelper;

function checkAutosuggestion(label, type) {
  cy.get(".CodeMirror-hints")
    .contains(label)
    .then(($el) => {
      const after = getComputedStyle($el[0], "::after");
      const afterContent = after.getPropertyValue("content");
      expect(afterContent).eq(`"${type}"`);
    });
}
describe(" Nested List Widgets ", function () {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("a. Pasting - should show toast when nesting is greater than 3", function () {
    cy.addDsl(dsl);
    cy.openPropertyPaneByWidgetName("List1", "listwidgetv2");
    // Copy List1
    cy.get(".t--copy-widget").click({ force: true });
    cy.wait(500);
    //Paste inside List 1
    cy.get(`${widgetSelector("List1")} [type="CONTAINER_WIDGET"]`)
      .first()
      .click({ force: true })
      .type(`{${modifierKey}}{v}`);
    cy.wait(500);

    //Copy List 2 and Paste inside list 2
    cy.openPropertyPaneByWidgetName("List2", "listwidgetv2");
    cy.get(".t--copy-widget").click({ force: true });
    cy.wait(500);
    // Paste inside list 2
    cy.get(`${widgetSelector("List2")} [type="CONTAINER_WIDGET"]`)
      .first()
      .click({ force: true })
      .type(`{${modifierKey}}{v}`);
    cy.wait(500);

    //Now Both List1 and List2 are n-2 levels

    //Copy List2 and Past in List 1
    cy.openPropertyPaneByWidgetName("List2", "listwidgetv2");
    cy.get(".t--copy-widget").click({ force: true });
    cy.wait(500);
    cy.get(`${widgetSelector("List1Copy")} [type="CONTAINER_WIDGET"]`)
      .first()
      .click({ force: true })
      .type(`{${modifierKey}}{v}`);

    cy.wait(500);
    cy.validateToastMessage("Cannot have more than 3 levels of nesting");
    cy.get(`${widgetSelector("List2Copy1")}`).should("not.exist");
  });

  it("b. No cyclic dependency when using levelData in a child widget", () => {
    cy.dragAndDropToWidgetBySelector(
      "textwidget",
      '[data-widgetname-cy="List1"] [type="CONTAINER_WIDGET"]',
      {
        x: 150,
        y: 50,
      },
    );
    cy.openPropertyPane("textwidget");

    cy.updateCodeInput(".t--property-control-text", `{{currentItem.name}}`);

    cy.dragAndDropToWidgetBySelector(
      "textwidget",
      '[data-widgetname-cy="List1Copy"]',
      {
        x: 150,
        y: 100,
      },
    );
    cy.testJsontextclear("text");

    cy.get(".t--property-control-text .CodeMirror textarea").type(
      "{{level_1.currentView.",
      {
        force: true,
      },
    );
    checkAutosuggestion("Text1", "Object");
    checkAutosuggestion("List1Copy", "Object");

    cy.testJsontextclear("text");

    cy.get(".t--property-control-text .CodeMirror textarea").type(
      "{{level_1.currentView.List1Copy.",
      {
        force: true,
      },
    );
    checkAutosuggestion("backgroundColor", "String");
    checkAutosuggestion("itemSpacing", "Number");
    checkAutosuggestion("isVisible", "Boolean");
    checkAutosuggestion("listData", "Array");
    checkAutosuggestion("pageNo", "Number");
    checkAutosuggestion("pageSize", "Number");

    cy.get(".CodeMirror-hints").each(($el) => {
      cy.wrap($el).should("not.have.text", "currentItemsView");
    });

    cy.get(".CodeMirror-hints").each(($el) => {
      cy.wrap($el).should("not.have.text", "selectedItemView");
    });

    cy.get(".CodeMirror-hints").each(($el) => {
      cy.wrap($el).should("not.have.text", "triggeredItemView");
    });

    cy.get(".CodeMirror-hints")
      .contains("pageNo")
      .first()
      .click({ force: true });

    cy.get(`${widgetSelector("Text2")} .bp3-ui-text span`).should(
      "have.text",
      "1",
    );
  });

  it("c. Accessing CurrentView, SelectedItemView and TriggeredItemView from Sibling List widget", () => {
    cy.addDsl(nestedSiblingDsl);

    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List2",
          )} ${containerWidgetSelector} .t--widget-imagewidget`,
        )
        .should("have.length", 3),
    );

    cy.openPropertyPaneByWidgetName("Text4", "textwidget");
    cy.testJsontextclear("text");
    cy.get(".t--property-control-text .CodeMirror textarea").type(
      "{{level_1.currentView.List3.currentItemsView",
      {
        force: true,
      },
    );

    cy.get(`${widgetSelector("Text4")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("be.empty");

    cy.openPropertyPaneByWidgetName("Text4", "textwidget");

    cy.testJsontextclear("text");
    cy.get(".t--property-control-text .CodeMirror textarea").type(
      "{{level_1.currentView.List2.currentItemsView",
      {
        force: true,
      },
    );
    cy.wait(300);

    cy.get(`${widgetSelector("Text4")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("be.empty");

    cy.openPropertyPaneByWidgetName("Text5", "textwidget");
    cy.testJsontextclear("text");

    cy.get(".t--property-control-text .CodeMirror textarea").type(
      "{{List1.selectedItemView.List2.currentItemsView",
      {
        force: true,
      },
    );

    cy.get(`${widgetSelector("List1")} ${containerWidgetSelector} `)
      .first()
      .click({ force: true });

    cy.wait(300);

    cy.waitUntil(() =>
      cy
        .get(`${widgetSelector("Text5")} ${commonlocators.bodyTextStyle}`)
        .first()
        .contains("Text4"),
    );
  });
});
