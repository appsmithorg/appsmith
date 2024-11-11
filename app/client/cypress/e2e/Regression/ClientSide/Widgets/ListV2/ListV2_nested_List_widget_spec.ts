import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
import {
  agHelper,
  assertHelper,
  debuggerHelper,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import * as _ from "../../../../../support/Objects/ObjectsCore";
const widgetsPage = require("../../../../../locators/Widgets.json");

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;

function checkAutosuggestion(label, type) {
  cy.get(".CodeMirror-hints")
    .contains(label)
    .then(($el) => {
      const after = getComputedStyle($el[0], "::after");
      const afterContent = after.getPropertyValue("content");
      expect(afterContent).eq(`"${type}"`);
    });
}
describe(
  " Nested List Widgets ",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Sanity", "@tag.Binding"] },
  function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    it("1. Pasting - should show toast when nesting is greater than 3", function () {
      agHelper.AddDsl("Listv2/copy_paste_listv2_dsl");
      cy.openPropertyPaneByWidgetName("List1", "listwidgetv2");
      // Copy List1
      cy.get(widgetsPage.copyWidget).click({ force: true });
      cy.wait(500);
      //Paste inside List 1
      cy.get(`${widgetSelector("List1")} [type="CONTAINER_WIDGET"]`)
        .first()
        .click({ force: true })
        .type(`{${modifierKey}}{v}`);
      cy.wait(500);

      //Copy List 2 and Paste inside list 2
      cy.openPropertyPaneByWidgetName("List2", "listwidgetv2");
      cy.get(widgetsPage.copyWidget).click({ force: true });
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
      cy.get(widgetsPage.copyWidget).click({ force: true });
      cy.wait(500);
      cy.get(`${widgetSelector("List1Copy")} [type="CONTAINER_WIDGET"]`)
        .first()
        .click({ force: true })
        .type(`{${modifierKey}}{v}`);

      cy.wait(500);
      _.debuggerHelper.OpenDebugger();
      _.debuggerHelper.ClickLogsTab();
      _.debuggerHelper.DoesConsoleLogExist(
        "Cannot have more than 3 levels of nesting",
        true,
      );
      cy.get(`${widgetSelector("List2Copy1")}`).should("not.exist");
    });

    it("2. No cyclic dependency when using levelData in a child widget", () => {
      cy.dragAndDropToWidgetBySelector(
        "textwidget",
        '[data-widgetname-cy="List1"] [type="CONTAINER_WIDGET"]',
        {
          x: 150,
          y: 50,
        },
      );
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Text", "{{currentItem.name}}");

      cy.dragAndDropToWidgetBySelector(
        "textwidget",
        '[data-widgetname-cy="List1Copy"]',
        {
          x: 150,
          y: 100,
        },
      );
      propPane.TypeTextIntoField("Text", "{{level_1.currentView.");

      checkAutosuggestion("Text1", "Object");
      checkAutosuggestion("List1Copy", "Object");

      propPane.TypeTextIntoField("Text", "{{level_1.currentView.List1Copy.");
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

      agHelper.GetNClickByContains(".CodeMirror-hints", "pageNo", 0, true);
      assertHelper.AssertNetworkStatus("updateLayout");
      cy.get(`${widgetSelector("Text2")} .bp3-ui-text span`).should(
        "have.text",
        "1",
      );
    });

    it("3. Accessing CurrentView, SelectedItemView and TriggeredItemView from Sibling List widget", () => {
      agHelper.AddDsl("Listv2/ListV2_nested_sibling_listwidget_dsl");
      agHelper.AddDsl("Listv2/ListV2_nested_sibling_listwidget_dsl");

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
      propPane.RemoveText("Text");
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

      propPane.RemoveText("Text");
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
      propPane.RemoveText("Text");

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
  },
);
