import * as _ from "../../../../support/Objects/ObjectsCore";

let appName: string = "",
  datasourceName: string = "GraphQL_DS_",
  apiName: string = "GraphQL_API_";
let tokenToAuthorizeGraphQl: string = "",
  authoemail = "";

const GRAPHQL_QUERY = `query ($myid: Int!) {
	postById(id: $myid) {
	  id,
    title,
    content
  }
}`;

const CAPSULE_ID = 4;

const GRAPHQL_VARIABLES = `{
    "myid": ${CAPSULE_ID}
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

describe("GraphQL Datasource Implementation", function() {
  before(() => {
    appName = localStorage.getItem("AppName") || "";
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      datasourceName = `${datasourceName}${uid}`;
      apiName = `${apiName}${uid}`;
      authoemail = `ci${uid}@appsmith.com`;
      _.dataSources.CreateGraphqlDatasource(datasourceName);
    });
  });

  it("1. Should execute the API and validate the response", function() {
    /* Create an API */
    _.dataSources.CreateQueryAfterDSSaved();
    _.agHelper.ValidateNetworkStatus("@createNewApi", 201);

    _.apiPage.SelectPaneTab("Body");
    _.dataSources.UpdateGraphqlQueryAndVariable({
      query: GRAPHQL_QUERY,
      variable: GRAPHQL_VARIABLES,
    });

    _.apiPage.RunAPI(false, 20, {
      expectedPath: "response.body.data.body.data.postById.id",
      expectedRes: CAPSULE_ID,
    });
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("2. Pagination for limit based should work without offset", function() {
    /* Create an API */
    _.dataSources.NavigateFromActiveDS(datasourceName, true);
    _.apiPage.SelectPaneTab("Body");
    _.dataSources.UpdateGraphqlQueryAndVariable({
      query: GRAPHQL_LIMIT_QUERY,
    });

    // Change tab to Pagination tab
    _.apiPage.SelectPaneTab("Pagination");

    // Select Limit base Pagination
    _.apiPage.SelectPaginationTypeViaIndex(1);

    _.dataSources.UpdateGraphqlPaginationParams({
      limit: {
        variable: "firstz",
        value: "2",
      },
    });

    _.apiPage.RunAPI(false, 20, {
      expectedPath: "response.body.data.body.data.allPosts.edges[0].node.title",
      expectedRes: GRAPHQL_LIMIT_DATA[0].title_name,
    });
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("3. Pagination for limit based should work with offset", function() {
    /* Create an API */
    _.dataSources.NavigateFromActiveDS(datasourceName, true);
    _.apiPage.SelectPaneTab("Body");
    _.dataSources.UpdateGraphqlQueryAndVariable({
      query: GRAPHQL_LIMIT_QUERY,
    });

    // Change tab to Pagination tab
    _.apiPage.SelectPaneTab("Pagination");

    // Select Limit base Pagination
    _.apiPage.SelectPaginationTypeViaIndex(1);

    _.dataSources.UpdateGraphqlPaginationParams({
      limit: {
        variable: "firstz",
        value: "5",
      },
      offset: {
        variable: "offsetz",
        value: "10",
      },
    });

    _.apiPage.RunAPI(false, 20, {
      expectedPath: "response.body.data.body.data.allPosts.edges[0].node.title",
      expectedRes: GRAPHQL_LIMIT_DATA[1].title_name,
    });
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("4. Authenticated GraphQL", () => {
    _.dataSources.NavigateFromActiveDS(datasourceName, true);
    _.apiPage.SelectPaneTab("Body");
    _.dataSources.UpdateGraphqlQueryAndVariable({
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

    _.apiPage.RunAPI(false);
    cy.wait("@postExecute").then((interception: any) => {
      tokenToAuthorizeGraphQl = JSON.stringify(
        interception.response.body.data.body.data.signup.jwtToken,
      ).replace(/['"]+/g, "");
      _.agHelper.ActionContextMenuWithInPane("Delete");

      _.dataSources.NavigateFromActiveDS(datasourceName, true);
      _.apiPage.SelectPaneTab("Body");

      _.dataSources.UpdateGraphqlQueryAndVariable({
        query: `mutation {
          deletePostById(input: {id: ${CAPSULE_ID}}) {
            clientMutationId
            deletedPostId
          }
        }`,
      });
      _.apiPage.EnterHeader(
        "Authorization",
        "Bearer " + tokenToAuthorizeGraphQl,
        1,
      );
      _.apiPage.RunAPI(false);
      _.apiPage.ResponseStatusCheck("200 OK");
      cy.wait("@postExecute").should("not.have.a.property", "errors");

      _.apiPage.RunAPI(false);
      _.agHelper.Sleep(2000);

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
    });
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  after("Delete the created GraphQL ds", () => {
    _.dataSources.DeleteDatasouceFromActiveTab(datasourceName);
  });
});
