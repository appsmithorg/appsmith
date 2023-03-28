import * as _ from "../../../../support/Objects/ObjectsCore";

let appName = "";
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

const POST_ID = 4;

const GRAPHQL_VARIABLES = `{
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

describe("GraphQL Datasource Implementation", function () {
  before(() => {
    appName = localStorage.getItem("AppName") || "";
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      //apiName = `${apiName}${uid}`;
      authoemail = `ci${uid}@appsmith.com`;
    });
    _.dataSources.CreateDataSource("UnAuthenticatedGraphQL");
  });

  it("1. Should execute the API and validate the response", function () {
    _.apiPage.SelectPaneTab("Body");
    _.dataSources.UpdateGraphqlQueryAndVariable({
      query: GRAPHQL_QUERY,
      variable: GRAPHQL_VARIABLES,
    });

    _.apiPage.RunAPI(false, 20, {
      expectedPath: "response.body.data.body.data.postById.id",
      expectedRes: POST_ID,
    });
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("2. Pagination for limit based should work without offset", function () {
    /* Create an API */
    _.dataSources.CreateDataSource("UnAuthenticatedGraphQL");
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

  it("3. Pagination for limit based should work with offset", function () {
    /* Create an API */
    _.dataSources.CreateDataSource("UnAuthenticatedGraphQL");
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

  it("4. Authenticated GraphQL from GraphQL", () => {
    _.dataSources.CreateDataSource("UnAuthenticatedGraphQL");
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

      _.dataSources.UpdateGraphqlQueryAndVariable({
        query: `mutation {
          deletePostById(input: {id: ${POST_ID}}) {
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
      RunNValidateGraphQL();
    });
  });

  it("5. Authenticated GraphQL from Authenticated GraphQL", () => {
    //Trying to delete without Autho code to see validation error
    _.dataSources.CreateDataSource("UnAuthenticatedGraphQL");
    _.apiPage.SelectPaneTab("Body");
    _.dataSources.UpdateGraphqlQueryAndVariable({
      query: `mutation {
        deletePostById(input: {id: 7}) {
          clientMutationId
          deletedPostId
        }
      }`,
    });
    _.apiPage.RunAPI(false);
    _.agHelper.Sleep(2000);
    cy.wait("@postExecute").then((interception: any) => {
      let errors = JSON.stringify(
        interception.response.body.data.body.errors[0].message,
      ).replace(/['"]+/g, "");
      expect(errors).to.eq("permission denied for table posts");
    });

    //Create Autho code to validate Delete operation
    cy.get("@guid").then((uid) => {
      authoemail = `ci${uid}@appsmith.com`;
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
    });

    _.apiPage.RunAPI(false);
    _.agHelper.Sleep(2000);
    cy.wait("@postExecute").then((interception: any) => {
      tokenToAuthorizeGraphQl = JSON.stringify(
        interception.response.body.data.body.data.signup.jwtToken,
      ).replace(/['"]+/g, "");

      _.agHelper.ActionContextMenuWithInPane("Delete");

      //Create Auth GraphQL to verify Delete operation
      _.dataSources.CreateNFillAuthenticatedGraphQLDSForm(
        datasourceName,
        "Authorization",
        "Bearer " + tokenToAuthorizeGraphQl,
      );

      _.dataSources.CreateQueryAfterDSSaved();
      _.dataSources.UpdateGraphqlQueryAndVariable({
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
      _.dataSources.DeleteDatasouceFromActiveTab($dsName);
    });
  });

  function RunNValidateGraphQL() {
    _.apiPage.RunAPI(false);
    _.apiPage.ResponseStatusCheck("200 OK");
    cy.wait("@postExecute").should("not.have.a.property", "errors");

    //Running query again to see data is deleted fine & does not exists
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
    _.agHelper.ActionContextMenuWithInPane("Delete");
  }
});
