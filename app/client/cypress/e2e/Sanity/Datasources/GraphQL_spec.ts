import {
  agHelper,
  entityItems,
  apiPage,
  dataSources,
  locators,
  dataManager,
  propPane,
  assertHelper,
} from "../../../support/Objects/ObjectsCore";

let datasourceName = "GraphQL_DS";
let tokenToAuthorizeGraphQl = "";
let authoemail = "";

const GRAPHQL_QUERY = `query ($myid: Int!) {
	postById(id: $myid) {
	  id,
    title,
    content
  }
}`;

let POST_ID = 4;

let GRAPHQL_VARIABLES = `{
    "myid": ${POST_ID}
  }`;

const GRAPHQL_LIMIT_QUERY = `query($offsetz:Int, $firstz:Int){
          allPosts(offset:$offsetz, first:$firstz) {
            edges {
              node {
                id,
               title,
               content
              }
            }
          }
        }`;

const GRAPHQL_LIMIT_DATA = [
  { title_name: "The truth about All" },
  {
    title_name: "Right beautiful use.",
  },
];

describe(
  "GraphQL Datasource Implementation",
  {
    tags: ["@tag.Datasource", "@tag.Sanity", "@tag.Git", "@tag.AccessControl"],
  },
  function () {
    before(() => {
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        //apiName = `${apiName}${uid}`;
        authoemail = `ci${uid}@appsmith.com`;
      });
      dataSources.CreateDataSource("UnAuthenticatedGraphQL");
    });

    it("1. Should execute the API and validate the response", function () {
      apiPage.SelectPaneTab("Body");
      dataSources.UpdateGraphqlQueryAndVariable({
        query: GRAPHQL_QUERY,
        variable: GRAPHQL_VARIABLES,
      });

      apiPage.RunAPI(false, 20, {
        expectedPath: "response.body.data.body.data.postById.id",
        expectedRes: POST_ID,
      });
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Api,
      });
    });

    it("2. Pagination for limit based should work without offset", function () {
      /* Create an API */
      dataSources.CreateDataSource("UnAuthenticatedGraphQL");
      apiPage.SelectPaneTab("Body");
      dataSources.UpdateGraphqlQueryAndVariable({
        query: GRAPHQL_LIMIT_QUERY,
      });

      // Change tab to Pagination tab
      apiPage.SelectPaneTab("Pagination");

      // Select Limit base Pagination
      apiPage.SelectPaginationTypeViaIndex(1);

      dataSources.UpdateGraphqlPaginationParams({
        limit: {
          variable: "firstz",
          value: "2",
        },
      });

      apiPage.RunAPI(false, 20, {
        expectedPath:
          "response.body.data.body.data.allPosts.edges[0].node.title",
        expectedRes: GRAPHQL_LIMIT_DATA[0].title_name,
      });
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Api,
      });
    });

    it("3. Pagination for limit based should work with offset", function () {
      /* Create an API */
      dataSources.CreateDataSource("UnAuthenticatedGraphQL");
      apiPage.SelectPaneTab("Body");
      dataSources.UpdateGraphqlQueryAndVariable({
        query: GRAPHQL_LIMIT_QUERY,
      });

      // Change tab to Pagination tab
      apiPage.SelectPaneTab("Pagination");

      // Select Limit base Pagination
      apiPage.SelectPaginationTypeViaIndex(1);

      dataSources.UpdateGraphqlPaginationParams({
        limit: {
          variable: "firstz",
          value: "5",
        },
        offset: {
          variable: "offsetz",
          value: "10",
        },
      });

      apiPage.RunAPI(false, 20, {
        expectedPath:
          "response.body.data.body.data.allPosts.edges[0].node.title",
        expectedRes: GRAPHQL_LIMIT_DATA[1].title_name,
      });
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Api,
      });
    });

    it("4. Authenticated GraphQL from GraphQL", () => {
      dataSources.CreateDataSource("UnAuthenticatedGraphQL");
      apiPage.SelectPaneTab("Body");
      dataSources.UpdateGraphqlQueryAndVariable({
        query:
          `mutation {
        signup(
          input: {username: "appsmith", email:"` +
          authoemail +
          `", password: "appsmith"}
        ) {
          jwtToken
        }
      }`,
      });

      apiPage.RunAPI(false);
      cy.wait("@postExecute").then((interception: any) => {
        tokenToAuthorizeGraphQl = JSON.stringify(
          interception.response.body.data.body.data.signup.jwtToken,
        ).replace(/['"]+/g, "");

        dataSources.UpdateGraphqlQueryAndVariable({
          query: `mutation {
          deletePostById(input: {id: ${POST_ID}}) {
            clientMutationId
            deletedPostId
          }
        }`,
        });
        apiPage.EnterHeader(
          "Authorization",
          "Bearer " + tokenToAuthorizeGraphQl,
          1,
        );
        RunNValidateGraphQL();
      });
    });

    it("5. Authenticated GraphQL from Authenticated GraphQL", () => {
      //Trying to delete without Autho code to see validation error
      dataSources.CreateDataSource("UnAuthenticatedGraphQL");
      apiPage.SelectPaneTab("Body");
      dataSources.UpdateGraphqlQueryAndVariable({
        query: `mutation {
        deletePostById(input: {id: 7}) {
          clientMutationId
          deletedPostId
        }
      }`,
      });
      apiPage.RunAPI(false);
      agHelper.Sleep(2000);
      cy.wait("@postExecute").then((interception: any) => {
        let errors = JSON.stringify(
          interception.response.body.data.body.errors[0].message,
        ).replace(/['"]+/g, "");
        expect(errors).to.eq("permission denied for table posts");
      });

      //Create Autho code to validate Delete operation
      cy.get("@guid").then((uid) => {
        authoemail = `ci${uid}@appsmith.com`;
        dataSources.UpdateGraphqlQueryAndVariable({
          query:
            `mutation {
        signup(
          input: {username: "appsmith", email:"` +
            authoemail +
            `", password: "appsmith"}
        ) {
          jwtToken
        }
      }`,
        });
      });

      apiPage.RunAPI(false);
      agHelper.Sleep(2000);
      cy.wait("@postExecute").then((interception: any) => {
        tokenToAuthorizeGraphQl = JSON.stringify(
          interception.response.body.data.body.data.signup.jwtToken,
        ).replace(/['"]+/g, "");

        agHelper.ActionContextMenuWithInPane({
          action: "Delete",
          entityType: entityItems.Api,
        });

        //Create Auth GraphQL to verify Delete operation
        dataSources.NavigateToDSCreateNew();
        dataSources.CreatePlugIn("Authenticated GraphQL API");
        dataSources.CreateNFillAuthenticatedGraphQLDSForm(
          datasourceName,
          "Authorization",
          "Bearer " + tokenToAuthorizeGraphQl,
        );

        dataSources.CreateQueryAfterDSSaved();
        dataSources.UpdateGraphqlQueryAndVariable({
          query: `mutation {
          deletePostById(input: {id: 7}) {
            clientMutationId
            deletedPostId
          }
        }`,
        });
        RunNValidateGraphQL();
      });
      cy.get("@dsName").then(($dsName: any) => {
        dataSources.DeleteDatasourceFromWithinDS($dsName);
      });
    });

    it("6. Validate Authenticated GraphQL with Empty body & then Save as Datasource + Bug #26873", () => {
      POST_ID = 5;
      GRAPHQL_VARIABLES = `{
      "myid": ${POST_ID}
    }`;
      dataSources.CreateDataSource("UnAuthenticatedGraphQL");
      // cy.get("@dsName").then(($dsName: any) => {
      //   cy.log("DS Name: " + $dsName);
      // });

      apiPage.RunAPI(false);
      apiPage.ResponseStatusCheck("PE-ARG-5000");
      agHelper.Sleep(3500);
      cy.get("@postExecute").then((interception: any) => {
        expect(interception.response.body.data.isExecutionSuccess).to.eq(false);
        expect(interception.response.body.data.body).to.contains(
          "Your GraphQL query body is empty. Please edit the 'Body' tab of your GraphQL API to provide a query body.",
        );
      });

      apiPage.SelectPaneTab("Authentication");
      agHelper.GetNClick(locators._saveDatasource);

      agHelper.AssertText(
        locators._inputFieldByName("URL") + "//" + locators._inputField,
        "val",
        dataManager.dsValues[
          dataManager.defaultEnviorment
        ].GraphqlApiUrl_TED.replace("/graphql", ""),
      );
      // dataSources.SaveDSFromDialog(false); //verifies bug #26873, to uncomment below once bug is fixed
      // cy.get("@dsName").then(($dsName: any) => {
      //   entityExplorer.SelectEntityByName($dsName);
      //   apiPage.SelectPaneTab("Authentication");
      //   agHelper.ClickButton("Save as datasource");
      // });
      dataSources.SaveDatasource();
      agHelper.ValidateToastMessage("datasource created");
      agHelper.AssertElementVisibility(locators._saveDatasource);
      apiPage.SelectPaneTab("Body");
      dataSources.UpdateGraphqlQueryAndVariable({
        query: GRAPHQL_QUERY,
        variable: GRAPHQL_VARIABLES,
      });
      apiPage.RunAPI();
      agHelper.GetNClick(locators._saveDatasource);
      dataSources.AssertDataSourceInfo([
        dataManager.dsValues[
          dataManager.defaultEnviorment
        ].GraphqlApiUrl_TED.replace("/graphql", ""),
        "content-type",
        "application/json",
        "No",
      ]);
      agHelper.ClickButton("Edit");
      dataSources.ValidateNSelectDropdown(
        "Authentication type",
        "None",
        "OAuth 2.0",
      );
      propPane.AssertPropertiesDropDownValues("Grant type", [
        "Client Credentials",
        "Authorization Code",
      ]);

      // For Client Credentials Grant Type, the button should be Save
      // Default first selection from dropdown is Client Credentials
      assertHelper.AssertContains("Save", "exist", dataSources._saveDs);

      propPane.AssertPropertiesDropDownValues("Add Access Token To", [
        "Request Header",
        "Request Header",
      ]);
      agHelper.AssertElementVisibility(
        locators._visibleTextDiv("Datasource not authorized"),
      );
      agHelper.ClickButton("Cancel");
      dataSources.AssertDatasourceSaveModalVisibilityAndSave(false);

      //verify Same ds info are present that was present before editing the DS:
      dataSources.AssertDataSourceInfo([
        dataManager.dsValues[
          dataManager.defaultEnviorment
        ].GraphqlApiUrl_TED.replace("/graphql", ""),
        "content-type",
        "application/json",
        "No",
      ]);
    });

    function RunNValidateGraphQL() {
      apiPage.RunAPI(false);
      apiPage.ResponseStatusCheck("200 OK");
      cy.wait("@postExecute").should("not.have.a.property", "errors");

      //Running query again to see data is deleted fine & does not exists
      apiPage.RunAPI(false);
      agHelper.Sleep(2000);

      //to alter & try below:
      //cy.wait("@postExecute").should("have.deep.nested.property", 'errors', "No values were deleted in collection 'posts' because no values you can delete were found matching these criteria.");

      cy.get("@postExecute").then((interception: any) => {
        let errors = JSON.stringify(
          interception.response.body.data.body.errors[0].message,
        ).replace(/['"]+/g, "");
        expect(errors).to.eq(
          "No values were deleted in collection posts because no values you can delete were found matching these criteria.",
        );
      });
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Api,
      });
    }
  },
);
