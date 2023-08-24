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

    agHelper.Sleep();
    agHelper
      .GetElement(
        "//*[contains(@class,'t--graphql-query-editor')]//pre[contains(@class,'CodeMirror-line')]//span[contains(text(),'__offset__')]",
      )
      .dblclick()
      .then(($element) => {
        // Perform actions with the element
        cy.wrap($element).type("{selectall}").type("{{JSObject1.", {
          parseSpecialCharSequences: false,
        });
      });

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
    agHelper
      .GetElement(
        "//*[contains(@class,'t--graphql-query-editor')]//pre[contains(@class,'CodeMirror-line')]//span[contains(text(),'__limit__')]",
      )
      .dblclick()
      .then(($element) => {
        // Perform actions with the element
        cy.wrap($element).type("{selectall}").type("{{JSObject1.", {
          parseSpecialCharSequences: false,
        });
      });

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
