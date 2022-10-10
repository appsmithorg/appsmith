import datasourceFormData from "../../../../fixtures/datasources.json";
import {
  ERROR_ACTION_EXECUTE_FAIL,
  createMessage,
} from "../../../../support/Objects/CommonErrorMessages";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const locator = ObjectsRegistry.CommonLocators,
  apiPage = ObjectsRegistry.ApiPage,
  agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources,
  jsEditor = ObjectsRegistry.JSEditor;

const GRAPHQL_LIMIT_QUERY = `
  query {
    launchesPast(limit: "__limit__", offset: "__offset__") {
      mission_name
      rocket {
        rocket_name
`;

const GRAPHQL_RESPONSE = {
  mission_name: "Sentinel-6 Michael Freilich"
};

describe("Binding Expressions should not be truncated in Url and path extraction", function() {
  it("Bug 16702, Moustache+Quotes formatting goes wrong in graphql body resulting in autocomplete failure", function() {
    const jsObjectBody = `export default {
      limitValue: 1,
      offsetValue: 1,
    }`;

    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    apiPage.CreateAndFillGraphqlApi(datasourceFormData.graphqlApiUrl);
    dataSources.UpdateGraphqlQueryAndVariable({
      query: GRAPHQL_LIMIT_QUERY,
    });

    cy.get(".t--graphql-query-editor pre.CodeMirror-line span")
      .contains("__limit__")
      .click()
      .type("{{JSObject1.");
    agHelper.GetNClickByContains(locator._hints, "limitValue");

    /* Start: Block of code to remove error of detached node of codemirror for cypress reference */
    cy.get(".t--entity-name")
      .contains("Queries/JS")
      .click();

    cy.wait(1000);
    cy.get(".t--entity-name")
      .contains("JSObject1")
      .click();

    cy.get(".t--entity-name")
      .contains("Api1")
      .click();

    /* End: Block of code to remove error of detached node of codemirror for cypress reference */

    cy.get(".t--graphql-query-editor pre.CodeMirror-line span")
      .contains("__offset__")
      .should($el => {
        expect(Cypress.dom.isDetached($el)).to.false;
      })
      .click({ force: true })
      .type("{{JSObject1.");
    agHelper.GetNClickByContains(locator._hints, "offsetValue");

    cy.wait(1000);

    apiPage.RunAPI(false, 20, {
      expectedPath: "response.body.data.body.data.launchesPast[0].mission_name",
      expectedRes: GRAPHQL_RESPONSE.mission_name,
    });
  });
});
