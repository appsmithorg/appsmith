import { INTERCEPT } from "../../../../fixtures/variables";
import {
  agHelper,
  appSettings,
  assertHelper,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  entityItems,
  homePage,
  locators,
  table,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

let dsName: any;

describe(
  "Validate Mongo Query Pane Validations",
  { tags: ["@tag.Datasource", "@tag.Sanity"] },
  () => {
    before(() => {
      //dataSources.StartDataSourceRoutes(); //already started in index.js beforeeach
    });

    beforeEach(function () {
      if (INTERCEPT.MONGO) {
        cy.log("Mongo DB is not found. Using intercept");
        dataSources.StartInterceptRoutesForMongo();
      } else cy.log("Mongo DB is found, hence using actual DB");
    });

    it("1. Create Mongo Datasource & verify it has collections", () => {
      homePage.NavigateToHome();
      homePage.CreateNewApplication();
      PageList.AddNewPage("Generate page with data");
      //agHelper.GetNClick(homePage._buildFromDataTableActionCard);//Commenting this since this is not always available in new app
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper.GetNClickByContains(
        dataSources._dropdownOption,
        "Connect new datasource",
      );
      dataSources.CreateDataSource("Mongo", false);

      assertHelper.AssertNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
      agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
      agHelper.GetNClickByContains(dataSources._dropdownOption, "friends");

      GenerateCRUDNValidateDeployPage(
        "<p>Monica's old friend Rachel moves in with her after leaving her fiancé.</p>",
        `1994-09-22T00:00:00+00:00`,
        "http://www.tvmaze.com/episodes/40646/friends-1x01-the-one-where-it-all-began",
        11,
      );

      deployMode.NavigateBacktoEditor();
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
      appSettings.OpenPaneAndChangeTheme("Sunrise");
    });

    it("2. Create new CRUD collection 'AuthorNAwards' & refresh Entity Explorer to find the new collection", () => {
      const authorNAwardsArray = `[{
      "_id" : 1,
      "name" : {
          "first" : "John",
          "last" : "Backus"
      },
      "birth" : "1924-12-03T05:00:00Z",
      "death" : "2007-03-17T04:00:00Z",
      "contribs" : [
          "Fortran",
          "ALGOL",
          "Backus-Naur Form",
          "FP"
      ],
      "awards" : [
          {
              "award" : "W.W. McDowell Award",
              "year" : 1967,
              "by" : "IEEE Computer Society"
          },
          {
              "award" : "National Medal of Science",
              "year" : 1975,
              "by" : "National Science Foundation"
          },
          {
              "award" : "Turing Award",
              "year" : 1977,
              "by" : "ACM"
          },
          {
              "award" : "Draper Prize",
              "year" : 1993,
              "by" : "National Academy of Engineering"
          }
      ]
  },
  {
      "_id" : ObjectId("51df07b094c6acd67e492f41"),
      "name" : {
          "first" : "John",
          "last" : "McCarthy"
      },
      "birth" : "1927-09-04T04:00:00Z",
      "death" : "2011-12-24T05:00:00Z",
      "contribs" : [
          "Lisp",
          "Artificial Intelligence",
          "ALGOL"
      ],
      "awards" : [
          {
              "award" : "Turing Award",
              "year" : 1971,
              "by" : "ACM"
          },
          {
              "award" : "Kyoto Prize",
              "year" : 1988,
              "by" : "Inamori Foundation"
          },
          {
              "award" : "National Medal of Science",
              "year" : 1990,
              "by" : "National Science Foundation"
          }
      ]
  },
  {
    "_id" : ObjectId("51df07b094c6acd67e492f42"),
    "name" : {
          "first" : "Grace",
          "last" : "Hopper"
      },
      "title" : "Rear Admiral",
      "birth" : "1906-12-09T05:00:00Z",
      "death" : "1992-01-01T05:00:00Z",
      "contribs" : [
          "UNIVAC",
          "compiler",
          "FLOW-MATIC",
          "COBOL"
      ],
      "awards" : [
          {
              "award" : "Computer Sciences Man of the Year",
              "year" : 1969,
              "by" : "Data Processing Management Association"
          },
          {
              "award" : "Distinguished Fellow",
              "year" : 1973,
              "by" : " British Computer Society"
          },
          {
              "award" : "W. W. McDowell Award",
              "year" : 1976,
              "by" : "IEEE Computer Society"
          },
          {
              "award" : "National Medal of Technology",
              "year" : 1991,
              "by" : "United States"
          }
      ]
  },
  {
      "_id" : 4,
      "name" : {
          "first" : "Kristen",
          "last" : "Nygaard"
      },
      "birth" : "1926-08-27T04:00:00Z",
      "death" : "2002-08-10T04:00:00Z",
      "contribs" : [
          "OOP",
          "Simula"
      ],
      "awards" : [
          {
              "award" : "Rosing Prize",
              "year" : 1999,
              "by" : "Norwegian Data Association"
          },
          {
              "award" : "Turing Award",
              "year" : 2001,
              "by" : "ACM"
          },
          {
              "award" : "IEEE John von Neumann Medal",
              "year" : 2001,
              "by" : "IEEE"
          }
      ]
  },
  {
      "_id" : 5,
      "name" : {
          "first" : "Ole-Johan",
          "last" : "Dahl"
      },
      "birth" : "1931-10-12T04:00:00Z",
      "death" : "2002-06-29T04:00:00Z",
      "contribs" : [
          "OOP",
          "Simula"
      ],
      "awards" : [
          {
              "award" : "Rosing Prize",
              "year" : 1999,
              "by" : "Norwegian Data Association"
          },
          {
              "award" : "Turing Award",
              "year" : 2001,
              "by" : "ACM"
          },
          {
              "award" : "IEEE John von Neumann Medal",
              "year" : 2001,
              "by" : "IEEE"
          }
      ]
  },
  {
      "_id" : 6,
      "name" : {
          "first" : "Guido",
          "last" : "van Rossum"
      },
      "birth" : "1956-01-31T05:00:00Z",
      "contribs" : [
          "Python"
      ],
      "awards" : [
          {
              "award" : "Award for the Advancement of Free Software",
              "year" : 2001,
              "by" : "Free Software Foundation"
          },
          {
              "award" : "NLUUG Award",
              "year" : 2003,
              "by" : "NLUUG"
          }
      ]
  },
  {
      "_id" : ObjectId("51e062189c6ae665454e301d"),
      "name" : {
          "first" : "Dennis",
          "last" : "Ritchie"
      },
      "birth" : "1941-09-09T04:00:00Z",
      "death" : "2011-10-12T04:00:00Z",
      "contribs" : [
          "UNIX",
          "C"
      ],
      "awards" : [
          {
              "award" : "Turing Award",
              "year" : 1983,
              "by" : "ACM"
          },
          {
              "award" : "National Medal of Technology",
              "year" : 1998,
              "by" : "United States"
          },
          {
              "award" : "Japan Prize",
              "year" : 2011,
              "by" : "The Japan Prize Foundation"
          }
      ]
  }]`;

      dataSources.CreateQueryForDS(dsName);

      assertHelper.AssertNetworkStatus("@trigger");

      dataSources.ValidateNSelectDropdown(
        "Command",
        "Find document(s)",
        "Insert document(s)",
      );

      dataSources.EnterJSContext({
        fieldLabel: "Collection",
        fieldValue: "AuthorNAwards",
      });

      agHelper.EnterValue(authorNAwardsArray, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Documents",
      });

      agHelper.AssertAutoSave();
      agHelper.Sleep(2000); //for documents value to settle!
      dataSources.RunQuery();
      agHelper.Sleep(4000); //for capturing right response!
      cy.get("@postExecute").then((resObj: any) => {
        //cy.log("response is " + JSON.stringify(resObj));
        expect(
          parseInt(JSON.stringify(resObj.response.body.data.body.n)),
        ).to.eq(7);
      });

      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("3. Validate 'Find' record from new collection & verify query response", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "AuthorNAwards",
        "Find",
      );
      dataSources.ValidateNSelectDropdown("Command", "Find document(s)");
      dataSources.RunQueryNVerifyResponseViews(1, false);
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("4. Validate 'Find by ID' record from new collection & verify query response", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "AuthorNAwards",
        "Find by id",
      );
      dataSources.ValidateNSelectDropdown("Command", "Find document(s)");
      agHelper.EnterValue(`{"_id": ObjectId("51df07b094c6acd67e492f41")}`, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Query",
      });
      dataSources.RunQueryNVerifyResponseViews(1, false);
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("5. Validate 'Insert' record from new collection & verify query response", () => {
      const insertauthorNAwards = `[{
  "_id" : 8,
  "name" : {
      "first" : "Yukihiro",
      "aka" : "Matz",
      "last" : "Matsumoto"
  },
  "birth" : "1965-04-14T04:00:00Z",
  "contribs" : [
      "Ruby"
  ],
  "awards" : [
      {
          "award" : "Award for the Advancement of Free Software",
          "year" : "2011",
          "by" : "Free Software Foundation"
      }
  ]
},
{
  "_id" : 9,
  "name" : {
      "first" : "James",
      "last" : "Gosling"
  },
  "birth" : "1955-05-19T04:00:00Z",
  "contribs" : [
      "Java"
  ],
  "awards" : [
      {
          "award" : "The Economist Innovation Award",
          "year" : 2002,
          "by" : "The Economist"
      },
      {
          "award" : "Officer of the Order of Canada",
          "year" : 2007,
          "by" : "Canada"
      }
  ]
},
{
"_id" : ObjectId("51df07b094c6acd67e492f51"),
"name" : {
      "first" : "Martin",
      "last" : "Odersky"
  },
  "contribs" : [
      "Scala"
  ]
}]`;

      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "AuthorNAwards",
        "Insert",
      );
      dataSources.ValidateNSelectDropdown("Command", "Insert document(s)");
      agHelper.EnterValue(insertauthorNAwards, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Documents",
      });
      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        expect(
          parseInt(JSON.stringify(resObj.response.body.data.body.n)),
        ).to.eq(3);
      });
      agHelper.AssertElementVisibility(dataSources._queryResponse("JSON"));
      agHelper.AssertElementVisibility(dataSources._queryResponse("RAW"));
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("6. Validate 'Update' record from new collection & verify query response - Record not present - All Matching Document", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "AuthorNAwards",
        "Update",
      );
      dataSources.ValidateNSelectDropdown("Command", "Update document(s)");
      agHelper.EnterValue(`{"_id": 3}`, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Query",
      });

      agHelper.EnterValue(`{ "$set": { "birth": "1906-12-09T06:00:00Z" } }`, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Update",
      });
      dataSources.ValidateNSelectDropdown("Limit", "All matching documents");
      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        expect(
          parseInt(JSON.stringify(resObj.response.body.data.body.nModified)),
        ).to.eq(0);
      });
      agHelper.AssertElementVisibility(dataSources._queryResponse("JSON"));
      agHelper.AssertElementVisibility(dataSources._queryResponse("RAW"));
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("7. Validate 'Update' record from new collection & verify query response - Record present - All Matching Document", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "AuthorNAwards",
        "Update",
      );
      dataSources.ValidateNSelectDropdown("Command", "Update document(s)");
      agHelper.EnterValue(
        `{
      "name.first": "John",
      "awards": {
        "$elemMatch": {
          "award": "Turing Award"
        }
      }
    }`,
        {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Query",
        },
      );

      agHelper.EnterValue(`{ "$set": { "year": "1988" } }`, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Update",
      });
      dataSources.ValidateNSelectDropdown("Limit", "All matching documents");
      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        expect(
          parseInt(JSON.stringify(resObj.response.body.data.body.nModified)),
        ).to.eq(2);
      });
      agHelper.AssertElementVisibility(dataSources._queryResponse("JSON"));
      agHelper.AssertElementVisibility(dataSources._queryResponse("RAW"));
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("8. Validate 'Update' record from new collection & verify query response - Record present - Single document", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "AuthorNAwards",
        "Update",
      );
      dataSources.ValidateNSelectDropdown("Command", "Update document(s)");
      agHelper.EnterValue(`{"_id": 4}`, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Query",
      });

      agHelper.EnterValue(`{ "$set": { "birth": "1926-08-27T05:00:00Z" } }`, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Update",
      });
      dataSources.ValidateNSelectDropdown(
        "Limit",
        "All matching documents",
        "Single document",
      );

      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        expect(
          parseInt(JSON.stringify(resObj.response.body.data.body.nModified)),
        ).to.eq(1);
      });
      agHelper.AssertElementVisibility(dataSources._queryResponse("JSON"));
      agHelper.AssertElementVisibility(dataSources._queryResponse("RAW"));
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("9. Validate 'Delete' record from new collection & verify query response - Record not present - Single document", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "AuthorNAwards",
        "Delete",
      );
      dataSources.ValidateNSelectDropdown("Command", "Delete document(s)");
      agHelper.EnterValue(`{ "_id": ObjectId("51df07b094c6acd67e492f43") }`, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Query",
      });
      dataSources.ValidateNSelectDropdown("Limit", "Single document");
      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        expect(
          parseInt(JSON.stringify(resObj.response.body.data.body.n)),
        ).to.eq(0);
      });
      agHelper.AssertElementVisibility(dataSources._queryResponse("JSON"));
      agHelper.AssertElementVisibility(dataSources._queryResponse("RAW"));
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("10. Validate 'Delete' record from new collection & verify query response - Record present - Single document", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "AuthorNAwards",
        "Delete",
      );
      dataSources.ValidateNSelectDropdown("Command", "Delete document(s)");
      agHelper.EnterValue(`{ "_id": ObjectId("51df07b094c6acd67e492f41") }`, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Query",
      });

      dataSources.ValidateNSelectDropdown("Limit", "Single document");

      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        expect(
          parseInt(JSON.stringify(resObj.response.body.data.body.n)),
        ).to.eq(1);
      });
      agHelper.AssertElementVisibility(dataSources._queryResponse("JSON"));
      agHelper.AssertElementVisibility(dataSources._queryResponse("RAW"));
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("11. Validate 'Delete' record from new collection & verify query response - Record present - All Matching Document", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "AuthorNAwards",
        "Delete",
      );
      dataSources.ValidateNSelectDropdown("Command", "Delete document(s)");
      agHelper.EnterValue(`{ "awards.award": "Rosing Prize" }`, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Query",
      });

      dataSources.ValidateNSelectDropdown(
        "Limit",
        "Single document",
        "All matching documents",
      );

      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        expect(Number(JSON.stringify(resObj.response.body.data.body.n))).to.eq(
          2,
        );
      });
      agHelper.AssertElementVisibility(dataSources._queryResponse("JSON"));
      agHelper.AssertElementVisibility(dataSources._queryResponse("RAW"));
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("12. Validate 'Count' record from new collection & verify query response", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "AuthorNAwards",
        "Count",
      );
      dataSources.ValidateNSelectDropdown("Command", "Count");
      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        expect(Number(JSON.stringify(resObj.response.body.data.body.n))).to.eq(
          7,
        );
      });
      agHelper.AssertElementVisibility(dataSources._queryResponse("JSON"));
      agHelper.AssertElementVisibility(dataSources._queryResponse("RAW"));
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("13. Validate 'Distinct' record from new collection & verify query response", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "AuthorNAwards",
        "Distinct",
      );
      dataSources.ValidateNSelectDropdown("Command", "Distinct");
      agHelper.EnterValue(
        `{ "awards.award": "National Medal of Technology" }`,
        {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Query",
        },
      );

      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        expect(
          JSON.parse(JSON.stringify(resObj.response.body.data.body.values[0])),
        ).to.eql("51df07b094c6acd67e492f42");
        expect(
          JSON.parse(JSON.stringify(resObj.response.body.data.body.values[1])),
        ).to.eql("51e062189c6ae665454e301d");
      });
      agHelper.AssertElementVisibility(dataSources._queryResponse("JSON"));
      agHelper.AssertElementVisibility(dataSources._queryResponse("RAW"));
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("14. Validate 'Aggregate' record from new collection & verify query response", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "AuthorNAwards",
        "Aggregate",
      );
      dataSources.ValidateNSelectDropdown("Command", "Aggregate");
      dataSources.RunQueryNVerifyResponseViews(7, false);
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("15. Verify Generate CRUD for the new collection & Verify Deploy mode for table - AuthorNAwards", () => {
      dataSources.GeneratePageForDS(dsName);
      agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
      agHelper.GetNClickByContains(
        dataSources._dropdownOption,
        "AuthorNAwards",
      );
      GenerateCRUDNValidateDeployPage(
        `[{"award":"Award for the Advancement of Free Software","year":2001,"by":"Free Software Foundation"},{"award":"NLUUG Award","year":2003,"by":"NLUUG"}]`,
        "6",
        "",
        3,
      );
      // agHelper.NavigateBacktoEditor();
      // table.WaitUntilTableLoad();
    });

    it("16. Validate Deletion of the Newly Created Page - AuthorNAwards", () => {
      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad(0, 0, "v2");
      //Delete the test data
      PageList.ShowList();
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "AuthorNAwards",
        action: "Delete",
        entityType: entityItems.Page,
      });
    });

    it("17. Validate Drop of the Newly Created - AuthorNAwards - collection from datasource", () => {
      const dropCollection = `{ "drop": "AuthorNAwards" }`;
      dataSources.CreateQueryForDS(dsName);

      dataSources.ValidateNSelectDropdown("Command", "Find document(s)", "Raw");
      agHelper.RenameWithInPane("DropAuthorNAwards"); //Due to template appearing after renaming
      agHelper.GetNClick(dataSources._templateMenu);
      dataSources.EnterQuery(dropCollection);
      agHelper.FocusElement(locators._codeMirrorTextArea);
      //agHelper.VerifyEvaluatedValue(tableCreateQuery);

      dataSources.RunQuery();
      dataSources.AssertTableInVirtuosoList(dsName, "AuthorNAwards", false);

      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("18. Verify application does not break when user runs the query with wrong collection name", function () {
      const dropCollection = `{ "drop": "AuthorNAwards" }`;
      dataSources.CreateQueryForDS(dsName);
      dataSources.ValidateNSelectDropdown("Command", "Find document(s)", "Raw");
      agHelper.GetNClick(dataSources._templateMenu);
      agHelper.RenameWithInPane("DropAuthorNAwards");
      dataSources.EnterQuery(dropCollection);
      agHelper.FocusElement(locators._codeMirrorTextArea);
      //agHelper.VerifyEvaluatedValue(tableCreateQuery);
      dataSources.RunQuery({ expectedStatus: false });
      agHelper.AssertContains(
        "ns not found.",
        "exist",
        dataSources._queryError,
      );
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("19. Bug 13285 - Verfiy application can parse dates before and on or after Jan 1, 1970", () => {
      const birthNDeathArray = `[{
      "name": {
        "first": "John",
        "last": "Backus"
      },
      "birth": ISODate("0001-01-01T00:00:00.000+00:00"),
      "death": ISODate("2007-03-17T04:00:00Z"),
      "issue": 13285
    },
    {
      "name": {
        "first": "John",
        "last": "McCarthy"
      },
      "birth": ISODate("1927-09-04T04:00:00Z"),
      "death": ISODate("2011-12-24T05:00:00Z"),
      "issue": 13286
    },
    {
      "name": {
        "first": "Grace",
        "last": "Hopper"
      },
      "title": "Rear Admiral",
      "birth": ISODate("1906-12-09T05:00:00Z"),
      "death": ISODate("1992-01-01T05:00:00Z"),
      "issue": 13287
    },
    {
      "name": {
        "first": "Kristen",
        "last": "Nygaard"
      },
      "birth": ISODate("1926-08-27T04:00:00Z"),
      "death": ISODate("2002-08-10T04:00:00Z"),
      "issue": 13288
    }
  ]`;

      dataSources.CreateQueryForDS(dsName);

      assertHelper.AssertNetworkStatus("@trigger");

      dataSources.ValidateNSelectDropdown(
        "Command",
        "Find document(s)",
        "Insert document(s)",
      );

      agHelper.RenameWithInPane("InsertBirthNDeath");
      dataSources.EnterJSContext({
        fieldLabel: "Collection",
        fieldValue: "BirthNDeath",
      });

      agHelper.EnterValue(birthNDeathArray, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Documents",
      });

      agHelper.AssertAutoSave();
      agHelper.Sleep(2000); //for documents value to settle!
      dataSources.RunQuery();
      agHelper.Sleep(4000); //for capturing right response!
      cy.get("@postExecute").then((resObj: any) => {
        expect(
          parseInt(JSON.stringify(resObj.response.body.data.body.n)),
        ).to.eq(4);
      });
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      EditorNavigation.SelectEntityByName(dsName, EntityType.Datasource);

      //Execute a find query on this collection to see if dates are fetched properly
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "BirthNDeath",
        "Find",
      );
      dataSources.ValidateNSelectDropdown("Command", "Find document(s)");
      dataSources.RunQueryNVerifyResponseViews(4, false);
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      //Drop the collection `BirthNDeath`
      const dropCollection = `{ "drop": "BirthNDeath" }`;

      dataSources.CreateQueryForDS(dsName);
      dataSources.ValidateNSelectDropdown("Command", "Find document(s)", "Raw");
      agHelper.GetNClick(dataSources._templateMenu);
      agHelper.RenameWithInPane("DropBirthNDeath");
      dataSources.EnterQuery(dropCollection);
      agHelper.FocusElement(locators._codeMirrorTextArea);
      dataSources.RunQuery();
      dataSources.AssertTableInVirtuosoList(dsName, "BirthNDeath", false);
    });

    it("20. Verify Deletion of the datasource", () => {
      //Delete the test data
      // entityExplorer.expandCollapseEntity("Pages")
      // entityExplorer.ActionContextMenuByEntityName("Page1", "Delete", "Are you sure?"); //Cant be deleted since this is the Home page!
      // assertHelper.AssertNetworkStatus("@deletePage", 200);
      deployMode.DeployApp();
      deployMode.NavigateBacktoEditor();
      dataSources.DeleteDatasourceFromWithinDS(dsName, 409); //Friends pages are still using this ds
    });

    function GenerateCRUDNValidateDeployPage(
      col1Text: string,
      col2Text: string,
      col3Text: string,
      idIndex: number,
    ) {
      agHelper.GetNClick(dataSources._generatePageBtn);
      assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
      agHelper.AssertContains("Successfully generated a page");
      assertHelper.AssertNetworkStatus("@getActions", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      assertHelper.AssertNetworkStatus("@updateLayout", 200);

      agHelper.ClickButton("Got it");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitUntilTableLoad(0, 0, "v2");

      //Validating loaded table
      agHelper.AssertElementExist(dataSources._selectedRow);
      table.ReadTableRowColumnData(0, 0, "v2", 2000).then(($cellData) => {
        expect($cellData).to.eq(col1Text);
      });
      table.ReadTableRowColumnData(0, 3, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq(col2Text);
      });
      table.ReadTableRowColumnData(0, 6, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq(col3Text);
      });

      //Validating loaded JSON form
      cy.xpath(locators._buttonByText("Update")).then((selector) => {
        cy.wrap(selector)
          .invoke("attr", "class")
          .then((classes) => {
            //cy.log("classes are:" + classes);
            expect(classes).not.contain("bp3-disabled");
          });
      });
      dataSources.AssertJSONFormHeader(0, idIndex, "Id", "", true);
    }
  },
);
