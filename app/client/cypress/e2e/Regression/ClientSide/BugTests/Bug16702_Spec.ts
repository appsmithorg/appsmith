import {
  jsEditor,
  apiPage,
  agHelper,
  dataSources,
  dataManager,
  locators,
} from "../../../../support/Objects/ObjectsCore";

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

describe("Binding Expressions should not be truncated in Url and path extraction", function () {
  it("Bug 16702, Moustache+Quotes formatting goes wrong in graphql body resulting in autocomplete failure", function () {
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

    apiPage.CreateAndFillGraphqlApi(
      dataManager.dsValues[dataManager.defaultEnviorment].GraphqlApiUrl_TED,
    );
    dataSources.UpdateGraphqlQueryAndVariable({
      query: GRAPHQL_LIMIT_QUERY,
    });

    cy.get(".t--graphql-query-editor pre.CodeMirror-line span")
      .contains("__offset__")
      // .should($el => {
      //   expect(Cypress.dom.isDetached($el)).to.false;
      // })
      //.trigger("mouseover")
      .dblclick()
      .type("{{JSObject1.");
    agHelper.WaitUntilEleAppear(locators._hints);
    agHelper.GetElementsNAssertTextPresence(locators._hints, "offsetValue");
    agHelper.GetNClickByContains(locators._hints, "offsetValue");
    agHelper.Sleep();
    agHelper.TypeText(locators._codeMirrorTextArea, "offsetValue", 1);
    agHelper.Sleep(2000);

    /* Start: Block of code to remove error of detached node of codemirror for cypress reference */

    apiPage.SelectPaneTab("Params");
    apiPage.SelectPaneTab("Body");
    /* End: Block of code to remove error of detached node of codemirror for cypress reference */
    cy.get(".t--graphql-query-editor pre.CodeMirror-line span")
      .contains("__limit__")
      //.trigger("mouseover")
      .dblclick()
      .type("{{JSObject1.");

    agHelper.WaitUntilEleAppear(locators._hints);
    agHelper.GetElementsNAssertTextPresence(locators._hints, "limitValue");
    agHelper.GetNClickByContains(locators._hints, "limitValue");
    //Commenting this since - many runs means - API response is 'You are doing too many launches'
    // apiPage.RunAPI(false, 20, {
    //   expectedPath: "response.body.data.body.data.launchesPast[0].mission_name",
    //   expectedRes: GRAPHQL_RESPONSE.mission_name,
    // });
    apiPage.RunAPI(false);
  });
});
