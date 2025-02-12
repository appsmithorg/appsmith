import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import {
  agHelper,
  dataSources,
  locators,
  jsEditor,
} from "../../../../support/Objects/ObjectsCore";
import PageList from "../../../../support/Pages/PageList";
import EditorNavigation, {
  editorTabSelector,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

let dsName = "MongoDB";

describe("Tabs Navigation", { tags: ["@tag.IDE"] }, () => {
  before(() => {
    dataSources.CreateDataSource("Mongo");
    cy.renameDatasource(dsName);
  });

  it("should create and switch between JS files", () => {
    // Create first JS file
    jsEditor.CreateJSObject("", { prettify: false, toRun: false });
    jsEditor.RenameJSObjFromPane("Page1_JS1");

    // Create second JS file
    jsEditor.CreateJSObject("", { prettify: false, toRun: false });
    jsEditor.RenameJSObjFromPane("Page1_JS2");

    agHelper.GetNClick(editorTabSelector("page1_js1"));

    jsEditor.currentJSObjectName().then((jsObjName) => {
      expect(jsObjName).equal("Page1_JS1");
    });

    agHelper.GetNClick(editorTabSelector("page1_js2"));

    jsEditor.currentJSObjectName().then((jsObjName) => {
      expect(jsObjName).equal("Page1_JS2");
    });
  });

  it("should create and switch between queries", () => {
    dataSources.CreateQueryFromOverlay(dsName, "", "Page1_Query1");
    agHelper
      .GetElement("[data-testid='t--ide-tab-page1_query1']")
      .should("be.visible");
    dataSources.CreateQueryFromOverlay(dsName, "", "Page1_Query2");

    // Switch between tabs
    agHelper.GetNClick(editorTabSelector("page1_query1"));

    agHelper
      .GetElement(locators._activeEntityTab)
      .should("have.text", "Page1_Query1");

    agHelper.GetNClick(editorTabSelector("page1_query2"));

    agHelper
      .GetElement(locators._activeEntityTab)
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

    agHelper.GetNClick(editorTabSelector("page2_js1"));

    jsEditor.currentJSObjectName().then((jsObjName) => {
      expect(jsObjName).equal("Page2_JS1");
    });

    agHelper.GetNClick(editorTabSelector("page2_js2"));

    jsEditor.currentJSObjectName().then((jsObjName) => {
      expect(jsObjName).equal("Page2_JS2");
    });

    dataSources.CreateQueryFromOverlay(dsName, "", "Page2_Query1");
    dataSources.CreateQueryFromOverlay(dsName, "", "Page2_Query2");

    agHelper.GetNClick(editorTabSelector("page2_query1"));

    agHelper
      .GetElement(locators._activeEntityTab)
      .should("have.text", "Page2_Query1");

    agHelper.GetNClick(editorTabSelector("page2_query2"));

    agHelper
      .GetElement(locators._activeEntityTab)
      .should("have.text", "Page2_Query2");
  });

  it("Use tabs navigation with multiple pages", () => {
    EditorNavigation.NavigateToPage("Page1");
    agHelper.GetNClick(editorTabSelector("page1_query1"));

    agHelper
      .GetElement(locators._activeEntityTab)
      .should("have.text", "Page1_Query1");

    agHelper.GetNClick(editorTabSelector("page1_query2"));

    agHelper
      .GetElement(locators._activeEntityTab)
      .should("have.text", "Page1_Query2");

    PageLeftPane.switchSegment(PagePaneSegment.JS);

    agHelper.GetNClick(editorTabSelector("page1_js1"));

    jsEditor.currentJSObjectName().then((jsObjName) => {
      expect(jsObjName).equal("Page1_JS1");
    });

    agHelper.GetNClick(editorTabSelector("page1_js2"));

    jsEditor.currentJSObjectName().then((jsObjName) => {
      expect(jsObjName).equal("Page1_JS2");
    });

    EditorNavigation.NavigateToPage("Page2");
    PageLeftPane.switchSegment(PagePaneSegment.JS);
    agHelper.GetNClick(editorTabSelector("page2_js1"));

    jsEditor.currentJSObjectName().then((jsObjName) => {
      expect(jsObjName).equal("Page2_JS1");
    });

    agHelper.GetNClick(editorTabSelector("page2_js2"));

    jsEditor.currentJSObjectName().then((jsObjName) => {
      expect(jsObjName).equal("Page2_JS2");
    });
  });
});
