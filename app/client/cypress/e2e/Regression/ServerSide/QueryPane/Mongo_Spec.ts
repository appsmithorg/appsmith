import { INTERCEPT } from "../../../../fixtures/variables";
import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any;

describe("Validate Mongo Query Pane Validations", () => {
  before(() => {
    //_.dataSources.StartDataSourceRoutes(); //already started in index.js beforeeach
  });

  beforeEach(function () {
    if (INTERCEPT.MONGO) {
      cy.log("Mongo DB is not found. Using intercept");
      _.dataSources.StartInterceptRoutesForMongo();
    } else cy.log("Mongo DB is found, hence using actual DB");
  });

  it("1. Create Mongo Datasource & verify it has collections", () => {
    _.homePage.NavigateToHome();
    _.homePage.CreateNewApplication();
    _.entityExplorer.AddNewPage("Generate page with data");
    //_.agHelper.GetNClick(_.homePage._buildFromDataTableActionCard);//Commenting this since this is not always available in new app
    _.agHelper.GetNClick(_.dataSources._selectDatasourceDropdown);
    _.agHelper.GetNClickByContains(
      _.dataSources._dropdownOption,
      "Connect new datasource",
    );
    _.dataSources.CreateDataSource("Mongo", false);

    _.agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    _.agHelper.GetNClick(_.dataSources._selectTableDropdown, 0, true);
    _.agHelper.GetNClickByContains(_.dataSources._dropdownOption, "friends");

    GenerateCRUDNValidateDeployPage(
      "<p>Monica's old friend Rachel moves in with her after leaving her fiancé.</p>",
      `1994-09-22`,
      "http://www.tvmaze.com/episodes/40646/friends-1x01-the-one-where-it-all-began",
      11,
    );

    _.deployMode.NavigateBacktoEditor();
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
    _.appSettings.OpenPaneAndChangeTheme("Sunrise");
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

    _.dataSources.NavigateFromActiveDS(dsName, true);

    _.dataSources.ValidateNSelectDropdown(
      "Commands",
      "Find document(s)",
      "Insert document(s)",
    );

    _.agHelper.EnterValue("AuthorNAwards", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Collection",
    });

    _.agHelper.EnterValue(authorNAwardsArray, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Documents",
    });

    _.agHelper.AssertAutoSave();
    _.agHelper.Sleep(2000); //for documents value to settle!
    _.dataSources.RunQuery();
    _.agHelper.Sleep(4000); //for capturing right response!
    cy.get("@postExecute").then((resObj: any) => {
      //cy.log("response is " + JSON.stringify(resObj));
      expect(parseInt(JSON.stringify(resObj.response.body.data.body.n))).to.eq(
        7,
      );
    });
    _.agHelper.ActionContextMenuWithInPane("Delete");

    _.entityExplorer.ExpandCollapseEntity("Datasources");
    _.entityExplorer.ExpandCollapseEntity(dsName);
    _.entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh");
    _.agHelper.AssertElementVisible(
      _.entityExplorer._entityNameInExplorer("AuthorNAwards"),
    );
  });

  it("3. Validate 'Find' record from new collection & verify query response", () => {
    _.entityExplorer.ActionTemplateMenuByEntityName("AuthorNAwards", "Find");
    _.dataSources.ValidateNSelectDropdown("Commands", "Find document(s)");
    _.dataSources.RunQueryNVerifyResponseViews(1, false);
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("4. Validate 'Find by ID' record from new collection & verify query response", () => {
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "AuthorNAwards",
      "Find by ID",
    );
    _.dataSources.ValidateNSelectDropdown("Commands", "Find document(s)");
    _.agHelper.EnterValue(`{"_id": ObjectId("51df07b094c6acd67e492f41")}`, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Query",
    });
    _.dataSources.RunQueryNVerifyResponseViews(1, false);
    _.agHelper.ActionContextMenuWithInPane("Delete");
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

    _.entityExplorer.ActionTemplateMenuByEntityName("AuthorNAwards", "Insert");
    _.dataSources.ValidateNSelectDropdown("Commands", "Insert document(s)");
    _.agHelper.EnterValue(insertauthorNAwards, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Documents",
    });
    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(parseInt(JSON.stringify(resObj.response.body.data.body.n))).to.eq(
        3,
      );
    });
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("JSON"));
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("RAW"));
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("6. Validate 'Update' record from new collection & verify query response - Record not present - All Matching Document", () => {
    _.entityExplorer.ActionTemplateMenuByEntityName("AuthorNAwards", "Update");
    _.dataSources.ValidateNSelectDropdown("Commands", "Update document(s)");
    _.agHelper.EnterValue(`{"_id": 3}`, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Query",
    });

    _.agHelper.EnterValue(`{ "$set": { "birth": "1906-12-09T06:00:00Z" } }`, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Update",
    });
    _.dataSources.ValidateNSelectDropdown("Limit", "All matching documents");
    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(
        parseInt(JSON.stringify(resObj.response.body.data.body.nModified)),
      ).to.eq(0);
    });
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("JSON"));
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("RAW"));
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("7. Validate 'Update' record from new collection & verify query response - Record present - All Matching Document", () => {
    _.entityExplorer.ActionTemplateMenuByEntityName("AuthorNAwards", "Update");
    _.dataSources.ValidateNSelectDropdown("Commands", "Update document(s)");
    _.agHelper.EnterValue(
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

    _.agHelper.EnterValue(`{ "$set": { "year": "1988" } }`, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Update",
    });
    _.dataSources.ValidateNSelectDropdown("Limit", "All matching documents");
    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(
        parseInt(JSON.stringify(resObj.response.body.data.body.nModified)),
      ).to.eq(2);
    });
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("JSON"));
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("RAW"));
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("8. Validate 'Update' record from new collection & verify query response - Record present - Single document", () => {
    _.entityExplorer.ActionTemplateMenuByEntityName("AuthorNAwards", "Update");
    _.dataSources.ValidateNSelectDropdown("Commands", "Update document(s)");
    _.agHelper.EnterValue(`{"_id": 4}`, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Query",
    });

    _.agHelper.EnterValue(`{ "$set": { "birth": "1926-08-27T05:00:00Z" } }`, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Update",
    });
    _.dataSources.ValidateNSelectDropdown(
      "Limit",
      "All matching documents",
      "Single document",
    );

    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(
        parseInt(JSON.stringify(resObj.response.body.data.body.nModified)),
      ).to.eq(1);
    });
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("JSON"));
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("RAW"));
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("9. Validate 'Delete' record from new collection & verify query response - Record not present - Single document", () => {
    _.entityExplorer.ActionTemplateMenuByEntityName("AuthorNAwards", "Delete");
    _.dataSources.ValidateNSelectDropdown("Commands", "Delete document(s)");
    _.agHelper.EnterValue(`{ "_id": ObjectId("51df07b094c6acd67e492f43") }`, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Query",
    });
    _.dataSources.ValidateNSelectDropdown("Limit", "Single document");
    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(parseInt(JSON.stringify(resObj.response.body.data.body.n))).to.eq(
        0,
      );
    });
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("JSON"));
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("RAW"));
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("10. Validate 'Delete' record from new collection & verify query response - Record present - Single document", () => {
    _.entityExplorer.ActionTemplateMenuByEntityName("AuthorNAwards", "Delete");
    _.dataSources.ValidateNSelectDropdown("Commands", "Delete document(s)");
    _.agHelper.EnterValue(`{ "_id": ObjectId("51df07b094c6acd67e492f41") }`, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Query",
    });

    _.dataSources.ValidateNSelectDropdown("Limit", "Single document");

    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(parseInt(JSON.stringify(resObj.response.body.data.body.n))).to.eq(
        1,
      );
    });
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("JSON"));
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("RAW"));
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("11. Validate 'Delete' record from new collection & verify query response - Record present - All Matching Document", () => {
    _.entityExplorer.ActionTemplateMenuByEntityName("AuthorNAwards", "Delete");
    _.dataSources.ValidateNSelectDropdown("Commands", "Delete document(s)");
    _.agHelper.EnterValue(`{ "awards.award": "Rosing Prize" }`, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Query",
    });

    _.dataSources.ValidateNSelectDropdown(
      "Limit",
      "Single document",
      "All matching documents",
    );

    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(Number(JSON.stringify(resObj.response.body.data.body.n))).to.eq(2);
    });
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("JSON"));
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("RAW"));
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("12. Validate 'Count' record from new collection & verify query response", () => {
    _.entityExplorer.ActionTemplateMenuByEntityName("AuthorNAwards", "Count");
    _.dataSources.ValidateNSelectDropdown("Commands", "Count");
    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(Number(JSON.stringify(resObj.response.body.data.body.n))).to.eq(7);
    });
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("JSON"));
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("RAW"));
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("13. Validate 'Distinct' record from new collection & verify query response", () => {
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "AuthorNAwards",
      "Distinct",
    );
    _.dataSources.ValidateNSelectDropdown("Commands", "Distinct");
    _.agHelper.EnterValue(
      `{ "awards.award": "National Medal of Technology" }`,
      {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Query",
      },
    );

    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(
        JSON.parse(JSON.stringify(resObj.response.body.data.body.values[0])),
      ).to.eql("51df07b094c6acd67e492f42");
      expect(
        JSON.parse(JSON.stringify(resObj.response.body.data.body.values[1])),
      ).to.eql("51e062189c6ae665454e301d");
    });
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("JSON"));
    _.agHelper.AssertElementVisible(_.dataSources._queryResponse("RAW"));
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("14. Validate 'Aggregate' record from new collection & verify query response", () => {
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "AuthorNAwards",
      "Aggregate",
    );
    _.dataSources.ValidateNSelectDropdown("Commands", "Aggregate");
    _.dataSources.RunQueryNVerifyResponseViews(7, false);
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("15. Verify Generate CRUD for the new collection & Verify Deploy mode for table - AuthorNAwards", () => {
    _.dataSources.NavigateFromActiveDS(dsName, false);
    _.agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    _.agHelper.GetNClick(_.dataSources._selectTableDropdown, 0, true);
    _.agHelper.GetNClickByContains(
      _.dataSources._dropdownOption,
      "AuthorNAwards",
    );
    GenerateCRUDNValidateDeployPage(
      `[{"award":"Award for the Advancement of Free Software","year":2001,"by":"Free Software Foundation"},{"award":"NLUUG Award","year":2003,"by":"NLUUG"}]`,
      "6",
      "",
      3,
    );
    // _.agHelper.NavigateBacktoEditor();
    // _.table.WaitUntilTableLoad();
  });

  it("16. Validate Deletion of the Newly Created Page - AuthorNAwards", () => {
    _.deployMode.NavigateBacktoEditor();
    _.table.WaitUntilTableLoad();
    //Delete the test data
    _.entityExplorer.ExpandCollapseEntity("Pages");
    _.entityExplorer.ActionContextMenuByEntityName(
      "AuthorNAwards",
      "Delete",
      "Are you sure?",
    );
    _.agHelper.ValidateNetworkStatus("@deletePage", 200);
  });

  it("17. Validate Drop of the Newly Created - AuthorNAwards - collection from datasource", () => {
    const dropCollection = `{ "drop": "AuthorNAwards" }`;
    _.dataSources.NavigateFromActiveDS(dsName, true);

    _.dataSources.ValidateNSelectDropdown(
      "Commands",
      "Find document(s)",
      "Raw",
    );
    _.agHelper.RenameWithInPane("DropAuthorNAwards"); //Due to template appearing after renaming
    // Resetting the default query and rewriting a new one
    _.dataSources.EnterQuery("");
    _.dataSources.EnterQuery(dropCollection);
    _.agHelper.FocusElement(_.locators._codeMirrorTextArea);
    //_.agHelper.VerifyEvaluatedValue(tableCreateQuery);

    _.dataSources.RunQuery();
    _.agHelper.ActionContextMenuWithInPane("Delete");
    _.entityExplorer.ExpandCollapseEntity("Datasources");
    _.entityExplorer.ExpandCollapseEntity(dsName);
    _.entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh");
    _.agHelper.AssertElementAbsence(
      _.entityExplorer._entityNameInExplorer("AuthorNAwards"),
    );
  });

  it("18. Verify application does not break when user runs the query with wrong collection name", function () {
    const dropCollection = `{ "drop": "AuthorNAwards" }`;
    _.dataSources.NavigateFromActiveDS(dsName, true);
    _.dataSources.ValidateNSelectDropdown(
      "Commands",
      "Find document(s)",
      "Raw",
    );
    // Resetting the default query and rewriting a new one
    _.dataSources.EnterQuery("");
    _.agHelper.RenameWithInPane("DropAuthorNAwards");
    _.dataSources.EnterQuery(dropCollection);
    _.agHelper.FocusElement(_.locators._codeMirrorTextArea);
    //_.agHelper.VerifyEvaluatedValue(tableCreateQuery);
    _.dataSources.RunQuery({ expectedStatus: false });
    _.agHelper.AssertContains(
      "ns not found.",
      "exist",
      _.dataSources._queryError,
    );
    _.agHelper.ActionContextMenuWithInPane("Delete");
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

    _.dataSources.NavigateFromActiveDS(dsName, true);

    _.dataSources.ValidateNSelectDropdown(
      "Commands",
      "Find document(s)",
      "Insert document(s)",
    );

    _.agHelper.RenameWithInPane("InsertBirthNDeath");
    _.agHelper.EnterValue("BirthNDeath", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Collection",
    });

    _.agHelper.EnterValue(birthNDeathArray, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Documents",
    });

    _.agHelper.AssertAutoSave();
    _.agHelper.Sleep(2000); //for documents value to settle!
    _.dataSources.RunQuery();
    _.agHelper.Sleep(4000); //for capturing right response!
    cy.get("@postExecute").then((resObj: any) => {
      expect(parseInt(JSON.stringify(resObj.response.body.data.body.n))).to.eq(
        4,
      );
    });
    _.agHelper.ActionContextMenuWithInPane("Delete");

    //Execute a find query on this collection to see if dates are fetched properly
    _.entityExplorer.ExpandCollapseEntity("Datasources");
    _.entityExplorer.ExpandCollapseEntity(dsName);
    _.entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh");
    _.agHelper.AssertElementVisible(
      _.entityExplorer._entityNameInExplorer("BirthNDeath"),
    );

    _.entityExplorer.ActionTemplateMenuByEntityName("BirthNDeath", "Find");
    _.dataSources.ValidateNSelectDropdown("Commands", "Find document(s)");
    _.dataSources.RunQueryNVerifyResponseViews(4, false);
    _.agHelper.ActionContextMenuWithInPane("Delete");

    //Drop the collection `BirthNDeath`
    const dropCollection = `{ "drop": "BirthNDeath" }`;

    _.dataSources.NavigateFromActiveDS(dsName, true);
    _.dataSources.ValidateNSelectDropdown(
      "Commands",
      "Find document(s)",
      "Raw",
    );
    // Resetting the default query and rewriting a new one
    _.dataSources.EnterQuery("");
    _.agHelper.RenameWithInPane("DropBirthNDeath");
    _.dataSources.EnterQuery(dropCollection);
    _.agHelper.FocusElement(_.locators._codeMirrorTextArea);
    _.dataSources.RunQuery();

    _.entityExplorer.ExpandCollapseEntity("Datasources");
    _.entityExplorer.ExpandCollapseEntity(dsName);
    _.entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh");
    _.agHelper.AssertElementAbsence(
      _.entityExplorer._entityNameInExplorer("BirthNDeath"),
    );
  });

  it("20. Verify Deletion of the datasource", () => {
    //Delete the test data
    // _.entityExplorer.expandCollapseEntity("Pages")
    // _.entityExplorer.ActionContextMenuByEntityName("Page1", "Delete", "Are you sure?"); //Cant be deleted since this is the Home page!
    // _.agHelper.ValidateNetworkStatus("@deletePage", 200);
    _.deployMode.DeployApp();
    _.deployMode.NavigateBacktoEditor();
    _.dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Friends pages are still using this ds
  });

  function GenerateCRUDNValidateDeployPage(
    col1Text: string,
    col2Text: string,
    col3Text: string,
    idIndex: number,
  ) {
    _.agHelper.GetNClick(_.dataSources._generatePageBtn);
    _.agHelper.ValidateNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    _.agHelper.AssertContains("Successfully generated a page");
    _.agHelper.ValidateNetworkStatus("@getActions", 200);
    _.agHelper.ValidateNetworkStatus("@postExecute", 200);
    _.agHelper.ValidateNetworkStatus("@updateLayout", 200);

    _.agHelper.GetNClick(_.dataSources._visibleTextSpan("Got it"));
    _.deployMode.DeployApp();

    //Validating loaded table
    _.agHelper.AssertElementExist(_.dataSources._selectedRow);
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq(col1Text);
    });
    _.table.ReadTableRowColumnData(0, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq(col2Text);
    });
    _.table.ReadTableRowColumnData(0, 6, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq(col3Text);
    });

    //Validating loaded JSON form
    cy.xpath(_.locators._spanButton("Update")).then((selector) => {
      cy.wrap(selector)
        .invoke("attr", "class")
        .then((classes) => {
          //cy.log("classes are:" + classes);
          expect(classes).not.contain("bp3-disabled");
        });
    });
    _.dataSources.AssertJSONFormHeader(0, idIndex, "Id", "", true);
  }
});
