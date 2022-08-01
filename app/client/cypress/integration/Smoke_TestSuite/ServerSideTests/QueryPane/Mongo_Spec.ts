import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any;

let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  homePage = ObjectsRegistry.HomePage,
  dataSources = ObjectsRegistry.DataSources,
  deployMode = ObjectsRegistry.DeployMode,
  table = ObjectsRegistry.Table,
  propPane = ObjectsRegistry.PropertyPane;

describe("Validate Mongo Query Pane Validations", () => {
  before(() => {
    //dataSources.StartDataSourceRoutes(); //already started in index.js beforeeach
  });

  beforeEach(function() {
    if (Cypress.env("Mongo") === 0) {
      cy.log("Mongo DB is not found. Using intercept");
      dataSources.StartInterceptRoutesForMongo();
    } else cy.log("Mongo DB is found, hence using actual DB");
  });

  it("1. Create Mongo Datasource & verify it has collections", () => {
    homePage.NavigateToHome();
    homePage.CreateNewApplication();
    agHelper.GetNClick(homePage._buildFromDataTableActionCard);
    agHelper.GetNClick(dataSources._selectDatasourceDropdown);
    agHelper.GetNClickByContains(
      dataSources._dropdownOption,
      "Connect New Datasource",
    );
    dataSources.CreateDataSource("Mongo", false);

    agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "friends");

    GenerateCRUDNValidateDeployPage(
      "<p>Monica's old friend Rachel moves in with her after leaving her fiancé.</p>",
      `1994-09-22`,
      "http://www.tvmaze.com/episodes/40646/friends-1x01-the-one-where-it-all-began",
      11,
    );

    deployMode.NavigateBacktoEditor();
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
    propPane.ChangeTheme("Modern");
  });

  it("2. Create new CRUD collection 'AuthorNAwards' & refresh Entity Explorer to find the new collection", () => {
    let authorNAwardsArray = `[{
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

    dataSources.NavigateFromActiveDS(dsName, true);

    dataSources.ValidateNSelectDropdown(
      "Commands",
      "Find Document(s)",
      "Insert Document(s)",
    );

    agHelper.EnterValue("AuthorNAwards", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Collection",
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
      expect(parseInt(JSON.stringify(resObj.response.body.data.body.n))).to.eq(
        7,
      );
    });
    agHelper.ActionContextMenuWithInPane("Delete");

    ee.ExpandCollapseEntity("DATASOURCES");
    ee.ExpandCollapseEntity(dsName);
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(ee._entityNameInExplorer("AuthorNAwards"));
  });

  it("3. Validate 'Find' record from new collection & verify query response", () => {
    ee.ActionTemplateMenuByEntityName("AuthorNAwards", "Find");
    dataSources.ValidateNSelectDropdown("Commands", "Find Document(s)");
    dataSources.RunQueryNVerifyResponseViews(1, false);
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("4. Validate 'Find by ID' record from new collection & verify query response", () => {
    ee.ActionTemplateMenuByEntityName("AuthorNAwards", "Find by ID");
    dataSources.ValidateNSelectDropdown("Commands", "Find Document(s)");
    agHelper.EnterValue(`{"_id": ObjectId("51df07b094c6acd67e492f41")}`, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Query",
    });
    dataSources.RunQueryNVerifyResponseViews(1, false);
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("5. Validate 'Insert' record from new collection & verify query response", () => {
    let insertauthorNAwards = `[{
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

    ee.ActionTemplateMenuByEntityName("AuthorNAwards", "Insert");
    dataSources.ValidateNSelectDropdown("Commands", "Insert Document(s)");
    agHelper.EnterValue(insertauthorNAwards, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Documents",
    });
    dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(parseInt(JSON.stringify(resObj.response.body.data.body.n))).to.eq(
        3,
      );
    });
    agHelper.AssertElementVisible(dataSources._queryResponse("JSON"));
    agHelper.AssertElementVisible(dataSources._queryResponse("RAW"));
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("6. Validate 'Update' record from new collection & verify query response - Record not present - All Matching Document", () => {
    ee.ActionTemplateMenuByEntityName("AuthorNAwards", "Update");
    dataSources.ValidateNSelectDropdown("Commands", "Update Document(s)");
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
    dataSources.ValidateNSelectDropdown("Limit", "All Matching Documents");
    dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(
        parseInt(JSON.stringify(resObj.response.body.data.body.nModified)),
      ).to.eq(0);
    });
    agHelper.AssertElementVisible(dataSources._queryResponse("JSON"));
    agHelper.AssertElementVisible(dataSources._queryResponse("RAW"));
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("7. Validate 'Update' record from new collection & verify query response - Record present - All Matching Document", () => {
    ee.ActionTemplateMenuByEntityName("AuthorNAwards", "Update");
    dataSources.ValidateNSelectDropdown("Commands", "Update Document(s)");
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
    dataSources.ValidateNSelectDropdown("Limit", "All Matching Documents");
    dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(
        parseInt(JSON.stringify(resObj.response.body.data.body.nModified)),
      ).to.eq(2);
    });
    agHelper.AssertElementVisible(dataSources._queryResponse("JSON"));
    agHelper.AssertElementVisible(dataSources._queryResponse("RAW"));
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("8. Validate 'Update' record from new collection & verify query response - Record present - Single Document", () => {
    ee.ActionTemplateMenuByEntityName("AuthorNAwards", "Update");
    dataSources.ValidateNSelectDropdown("Commands", "Update Document(s)");
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
      "All Matching Documents",
      "Single Document",
    );

    dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(
        parseInt(JSON.stringify(resObj.response.body.data.body.nModified)),
      ).to.eq(1);
    });
    agHelper.AssertElementVisible(dataSources._queryResponse("JSON"));
    agHelper.AssertElementVisible(dataSources._queryResponse("RAW"));
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("9. Validate 'Delete' record from new collection & verify query response - Record not present - Single Document", () => {
    ee.ActionTemplateMenuByEntityName("AuthorNAwards", "Delete");
    dataSources.ValidateNSelectDropdown("Commands", "Delete Document(s)");
    agHelper.EnterValue(`{ "_id": ObjectId("51df07b094c6acd67e492f43") }`, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Query",
    });
    dataSources.ValidateNSelectDropdown("Limit", "Single Document");
    dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(parseInt(JSON.stringify(resObj.response.body.data.body.n))).to.eq(
        0,
      );
    });
    agHelper.AssertElementVisible(dataSources._queryResponse("JSON"));
    agHelper.AssertElementVisible(dataSources._queryResponse("RAW"));
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("10. Validate 'Delete' record from new collection & verify query response - Record present - Single Document", () => {
    ee.ActionTemplateMenuByEntityName("AuthorNAwards", "Delete");
    dataSources.ValidateNSelectDropdown("Commands", "Delete Document(s)");
    agHelper.EnterValue(`{ "_id": ObjectId("51df07b094c6acd67e492f41") }`, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Query",
    });

    dataSources.ValidateNSelectDropdown("Limit", "Single Document");

    dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(parseInt(JSON.stringify(resObj.response.body.data.body.n))).to.eq(
        1,
      );
    });
    agHelper.AssertElementVisible(dataSources._queryResponse("JSON"));
    agHelper.AssertElementVisible(dataSources._queryResponse("RAW"));
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("11. Validate 'Delete' record from new collection & verify query response - Record present - All Matching Document", () => {
    ee.ActionTemplateMenuByEntityName("AuthorNAwards", "Delete");
    dataSources.ValidateNSelectDropdown("Commands", "Delete Document(s)");
    agHelper.EnterValue(`{ "awards.award": "Rosing Prize" }`, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Query",
    });

    dataSources.ValidateNSelectDropdown(
      "Limit",
      "Single Document",
      "All Matching Documents",
    );

    dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(Number(JSON.stringify(resObj.response.body.data.body.n))).to.eq(2);
    });
    agHelper.AssertElementVisible(dataSources._queryResponse("JSON"));
    agHelper.AssertElementVisible(dataSources._queryResponse("RAW"));
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("12. Validate 'Count' record from new collection & verify query response", () => {
    ee.ActionTemplateMenuByEntityName("AuthorNAwards", "Count");
    dataSources.ValidateNSelectDropdown("Commands", "Count");
    dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(Number(JSON.stringify(resObj.response.body.data.body.n))).to.eq(7);
    });
    agHelper.AssertElementVisible(dataSources._queryResponse("JSON"));
    agHelper.AssertElementVisible(dataSources._queryResponse("RAW"));
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("13. Validate 'Distinct' record from new collection & verify query response", () => {
    ee.ActionTemplateMenuByEntityName("AuthorNAwards", "Distinct");
    dataSources.ValidateNSelectDropdown("Commands", "Distinct");
    agHelper.EnterValue(`{ "awards.award": "National Medal of Technology" }`, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Query",
    });

    dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(
        JSON.parse(JSON.stringify(resObj.response.body.data.body.values[0])),
      ).to.eql("51df07b094c6acd67e492f42");
      expect(
        JSON.parse(JSON.stringify(resObj.response.body.data.body.values[1])),
      ).to.eql("51e062189c6ae665454e301d");
    });
    agHelper.AssertElementVisible(dataSources._queryResponse("JSON"));
    agHelper.AssertElementVisible(dataSources._queryResponse("RAW"));
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("14. Validate 'Aggregate' record from new collection & verify query response", () => {
    ee.ActionTemplateMenuByEntityName("AuthorNAwards", "Aggregate");
    dataSources.ValidateNSelectDropdown("Commands", "Aggregate");
    dataSources.RunQueryNVerifyResponseViews(7, false);
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("15. Verify Generate CRUD for the new collection & Verify Deploy mode for table - AuthorNAwards", () => {
    dataSources.NavigateFromActiveDS(dsName, false);
    agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "AuthorNAwards");
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
    table.WaitUntilTableLoad();
    //Delete the test data
    ee.ExpandCollapseEntity("PAGES");
    ee.ActionContextMenuByEntityName(
      "AuthorNAwards",
      "Delete",
      "Are you sure?",
    );
    agHelper.ValidateNetworkStatus("@deletePage", 200);
  });

  it("17. Validate Drop of the Newly Created - AuthorNAwards - collection from datasource", () => {
    let dropCollection = `{ "drop": "AuthorNAwards" }`;
    dataSources.NavigateFromActiveDS(dsName, true);

    dataSources.ValidateNSelectDropdown("Commands", "Find Document(s)", "Raw");
    agHelper.RenameWithInPane("DropAuthorNAwards"); //Due to template appearing after renaming

    dataSources.EnterQuery(dropCollection);
     agHelper.FocusElement(locator._codeMirrorTextArea);;
    //agHelper.VerifyEvaluatedValue(tableCreateQuery);

    dataSources.RunQuery();
    agHelper.ActionContextMenuWithInPane("Delete");
    ee.ExpandCollapseEntity("DATASOURCES");
    ee.ExpandCollapseEntity(dsName);
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementAbsence(ee._entityNameInExplorer("AuthorNAwards"));
  });

  it("18. Verify application does not break when user runs the query with wrong collection name", function() {
    let dropCollection = `{ "drop": "AuthorNAwards" }`;
    dataSources.NavigateFromActiveDS(dsName, true);
    dataSources.ValidateNSelectDropdown("Commands", "Find Document(s)", "Raw");
    agHelper.RenameWithInPane("DropAuthorNAwards");
    dataSources.EnterQuery(dropCollection);
     agHelper.FocusElement(locator._codeMirrorTextArea);;
    //agHelper.VerifyEvaluatedValue(tableCreateQuery);

    dataSources.RunQuery(false);
    agHelper
      .GetText(dataSources._queryError)
      .then(($errorText) => expect($errorText).to.eq("ns not found."));
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("19. Bug 13285 - Verfiy application can parse dates before and on or after Jan 1, 1970", () => {
    let birthNDeathArray = `[{
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
      "issue": 13285
    },
    {
      "name": {
        "first": "Grace",
        "last": "Hopper"
      },
      "title": "Rear Admiral",
      "birth": ISODate("1906-12-09T05:00:00Z"),
      "death": ISODate("1992-01-01T05:00:00Z"),
      "issue": 13285
    },
    {
      "name": {
        "first": "Kristen",
        "last": "Nygaard"
      },
      "birth": ISODate("1926-08-27T04:00:00Z"),
      "death": ISODate("2002-08-10T04:00:00Z"),
      "issue": 13285
    }
  ]`;

    dataSources.NavigateFromActiveDS(dsName, true);

    dataSources.ValidateNSelectDropdown(
      "Commands",
      "Find Document(s)",
      "Insert Document(s)",
    );

    agHelper.RenameWithInPane("InsertBirthNDeath");
    agHelper.EnterValue("BirthNDeath", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Collection",
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
      expect(parseInt(JSON.stringify(resObj.response.body.data.body.n))).to.eq(
        4,
      );
    });
    agHelper.ActionContextMenuWithInPane("Delete");

    //Execute a find query on this collection to see if dates are fetched properly
    ee.ExpandCollapseEntity("DATASOURCES");
    ee.ExpandCollapseEntity(dsName);
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(ee._entityNameInExplorer("BirthNDeath"));

    ee.ActionTemplateMenuByEntityName("BirthNDeath", "Find");
    dataSources.ValidateNSelectDropdown("Commands", "Find Document(s)");
    dataSources.RunQueryNVerifyResponseViews(4, false);
    agHelper.ActionContextMenuWithInPane("Delete");

    //Drop the collection `BirthNDeath`
    let dropCollection = `{ "drop": "BirthNDeath" }`;

    dataSources.NavigateFromActiveDS(dsName, true);
    dataSources.ValidateNSelectDropdown("Commands", "Find Document(s)", "Raw");
    agHelper.RenameWithInPane("DropBirthNDeath");
    dataSources.EnterQuery(dropCollection);
     agHelper.FocusElement(locator._codeMirrorTextArea);;
    dataSources.RunQuery();
  });

  it("20. Verify Deletion of the datasource", () => {
    //Delete the test data
    // ee.expandCollapseEntity("PAGES")
    // ee.ActionContextMenuByEntityName("Page1", "Delete", "Are you sure?"); //Cant be deleted since this is the Home page!
    // agHelper.ValidateNetworkStatus("@deletePage", 200);
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Friends pages are still using this ds
  });

  function GenerateCRUDNValidateDeployPage(
    col1Text: string,
    col2Text: string,
    col3Text: string,
    idIndex: number,
  ) {
    agHelper.GetNClick(dataSources._generatePageBtn);
    agHelper.ValidateNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    agHelper.ValidateToastMessage("Successfully generated a page");
    agHelper.ValidateNetworkStatus("@getActions", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@updateLayout", 200);

    agHelper.GetNClick(dataSources._visibleTextSpan("GOT IT"));
    deployMode.DeployApp();

    //Validating loaded table
    agHelper.AssertElementExist(dataSources._selectedRow);
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq(col1Text);
    });
    table.ReadTableRowColumnData(0, 3, 200).then(($cellData) => {
      expect($cellData).to.eq(col2Text);
    });
    table.ReadTableRowColumnData(0, 6, 200).then(($cellData) => {
      expect($cellData).to.eq(col3Text);
    });

    //Validating loaded JSON form
    cy.xpath(locator._spanButton("Update")).then((selector) => {
      cy.wrap(selector)
        .invoke("attr", "class")
        .then((classes) => {
          //cy.log("classes are:" + classes);
          expect(classes).not.contain("bp3-disabled");
        });
    });
    dataSources.AssertJSONFormHeader(0, idIndex, "Id", "", true);
  }
});
