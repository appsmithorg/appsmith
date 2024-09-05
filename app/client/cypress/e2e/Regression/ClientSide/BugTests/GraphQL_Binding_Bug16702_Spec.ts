import * as _ from "../../../../support/Objects/ObjectsCore";

const GRAPHQL_LIMIT_QUERY = `
  query {
    launchesPast(limit:
      "__limit__"
      ,offset:
      "__offset__"
      ) {
      mission_name
      rocket {
        rocket_name
`;

const GRAPHQL_RESPONSE = {
  mission_name: "Sentinel-6 Michael Freilich",
};

describe(
  "Binding Expressions should not be truncated in Url and path extraction",
  { tags: ["@tag.Datasource", "@tag.Binding"] },
  function () {
    it("Bug 16702, Moustache+Quotes formatting goes wrong in graphql body resulting in autocomplete failure", function () {
      const jsObjectBody = `export default {
      limitValue: 1,
      offsetValue: 1,
    }`;

      _.jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      });

      _.apiPage.CreateAndFillGraphqlApi(
        _.dataManager.dsValues[_.dataManager.defaultEnviorment]
          .GraphqlApiUrl_TED,
      );
      _.dataSources.UpdateGraphqlQueryAndVariable({
        query: GRAPHQL_LIMIT_QUERY,
      });

      // This adds offsetValue using autocomplete menu
      cy.get(".t--graphql-query-editor pre.CodeMirror-line span")
        .contains("__offset__")
        .dblclick();
      cy.focused().clear();
      cy.focused().type("{{JSObject1.");

      _.agHelper.GetNAssertElementText(
        _.locators._hints,
        "offsetValue",
        "have.text",
        1,
      );
      _.agHelper.TypeText(_.locators._codeMirrorTextArea, "offsetValue", 1);

      // This checks for a second variable if autocomplete menu shows or not,
      // thus asserting bug resolution of 16702
      cy.get(".t--graphql-query-editor pre.CodeMirror-line span")
        .contains("__limit__")
        .dblclick();
      cy.focused().clear();
      cy.focused().type("{{JSObject1.");
      _.agHelper.GetNClickByContains(_.locators._hints, "limitValue");
    });
  },
);
