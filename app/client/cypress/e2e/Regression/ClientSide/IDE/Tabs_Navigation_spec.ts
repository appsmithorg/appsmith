import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import {
  agHelper,
  dataSources,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import PageList from "../../../../support/Pages/PageList";
import EditorNavigation, {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import { EditorSegments } from "@appsmith/ads";

const jsEditor = ObjectsRegistry.JSEditor;
const datasources = ObjectsRegistry.DataSources;

let dsName = "MongoDB";

describe("Tabs Navigation", { tags: ["@tag.IDE"] }, () => {
  before(() => {
    datasources.CreateDataSource("Mongo");
    cy.renameDatasource(dsName);
  });

  it("should create and switch between JS files", () => {
    // Create first JS file
    jsEditor.CreateJSObject("", { prettify: false, toRun: false });
    jsEditor.RenameJSObjFromPane("Page1_JS1");

    // Create second JS file
    jsEditor.CreateJSObject("", { prettify: false, toRun: false });
    jsEditor.RenameJSObjFromPane("Page1_JS2");

    cy.get("[data-testid='t--ide-tab-page1_js1']").click();

    jsEditor.currentJSObjectName().then((jsObjName) => {
      expect(jsObjName).equal("Page1_JS1");
    });

    cy.get("[data-testid='t--ide-tab-page1_js2']").click();

    jsEditor.currentJSObjectName().then((jsObjName) => {
      expect(jsObjName).equal("Page1_JS2");
    });
  });

  it("should create and switch between queries", () => {
    datasources.CreateQueryFromOverlay(dsName, "", "Page1_Query1");
    cy.get("[data-testid='t--ide-tab-page1_query1']").should("be.visible");
    dataSources.CreateQueryFromOverlay(dsName, "", "Page1_Query2");

    // Switch between tabs
    cy.get("[data-testid='t--ide-tab-page1_query1']").click();

    agHelper
      .GetElement(locators._queryName)
      .should("have.text", "Page1_Query1");

    cy.get("[data-testid='t--ide-tab-page1_query2']").click();

    agHelper
      .GetElement(locators._queryName)
      .should("have.text", "Page1_Query2");
  });

  it("should create items in the next page and navigate", () => {
    // Create first page
    PageList.AddNewPage("New blank page");

    // Create first JS file
    jsEditor.CreateJSObject("", { prettify: false, toRun: false });
    jsEditor.RenameJSObjFromPane("Page2_JS1");

    // Create second JS file
    jsEditor.CreateJSObject("", { prettify: false, toRun: false });
    jsEditor.RenameJSObjFromPane("Page2_JS2");

    cy.get("[data-testid='t--ide-tab-page2_js1']").click();

    jsEditor.currentJSObjectName().then((jsObjName) => {
      expect(jsObjName).equal("Page2_JS1");
    });

    cy.get("[data-testid='t--ide-tab-page2_js2']").click();

    jsEditor.currentJSObjectName().then((jsObjName) => {
      expect(jsObjName).equal("Page2_JS2");
    });

    datasources.CreateQueryFromOverlay(dsName, "", "Page2_Query1");
    datasources.CreateQueryFromOverlay(dsName, "", "Page2_Query2");

    cy.get("[data-testid='t--ide-tab-page2_query1']").click();

    agHelper
      .GetElement(locators._queryName)
      .should("have.text", "Page2_Query1");

    cy.get("[data-testid='t--ide-tab-page2_query2']").click();

    agHelper
      .GetElement(locators._queryName)
      .should("have.text", "Page2_Query2");
  });

  it("Use tabs navigation with multiple pages", () => {
    EditorNavigation.NavigateToPage("Page1");
    cy.get("[data-testid='t--ide-tab-page1_query1']").click();

    agHelper
      .GetElement(locators._queryName)
      .should("have.text", "Page1_Query1");

    cy.get("[data-testid='t--ide-tab-page1_query2']").click();

    agHelper
      .GetElement(locators._queryName)
      .should("have.text", "Page1_Query2");

    PageLeftPane.switchSegment(PagePaneSegment.JS);

    cy.get("[data-testid='t--ide-tab-page1_js1']").click();

    jsEditor.currentJSObjectName().then((jsObjName) => {
      expect(jsObjName).equal("Page1_JS1");
    });

    cy.get("[data-testid='t--ide-tab-page1_js2']").click();

    jsEditor.currentJSObjectName().then((jsObjName) => {
      expect(jsObjName).equal("Page1_JS2");
    });

    EditorNavigation.NavigateToPage("Page2");
    PageLeftPane.switchSegment(PagePaneSegment.JS);
    cy.get("[data-testid='t--ide-tab-page2_js1']").click();

    jsEditor.currentJSObjectName().then((jsObjName) => {
      expect(jsObjName).equal("Page2_JS1");
    });

    cy.get("[data-testid='t--ide-tab-page2_js2']").click();

    jsEditor.currentJSObjectName().then((jsObjName) => {
      expect(jsObjName).equal("Page2_JS2");
    });
  });
});
