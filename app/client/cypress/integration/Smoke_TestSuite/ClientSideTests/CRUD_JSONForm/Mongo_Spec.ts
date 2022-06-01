import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let guid: any, dsName: any;

let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  homePage = ObjectsRegistry.HomePage,
  dataSources = ObjectsRegistry.DataSources,
  deployMode = ObjectsRegistry.DeployMode,
  table = ObjectsRegistry.Table;

describe("Validate Mongo CRUD with JSON Form", () => {
  before(() => {
    dataSources.StartDataSourceRoutes();
  });

  beforeEach(function() {
    if (Cypress.env("Mongo") === 0) {
      cy.log("Mongo DB is not found. Using intercept");
      dataSources.StartInterceptRoutesForMongo();
    } else cy.log("Mongo DB is found, hence using actual DB");
  });

  it("1. Create DS & then Add new Page and generate CRUD template using created datasource", () => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("MongoDB");
      guid = uid;
      agHelper.RenameWithInPane("Mongo " + guid, false);
      dataSources.FillMongoDSForm();
      dataSources.TestSaveDatasource();

      ee.AddNewPage();
      agHelper.GetNClick(homePage._buildFromDataTableActionCard);
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper.GetNClickByContains(
        dataSources._dropdownOption,
        "Mongo " + guid,
      );
      cy.wrap("Mongo " + guid).as("dsName");
    });
    agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.WaitUntilToastDisappear("datasource updated successfully");
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "pokemon");
    GenerateCRUDNValidateDeployPage(
      "http://www.serebii.net/pokemongo/pokemon/150.png",
      "150",
      `["Bug","Ghost","Dark"]`,
      10,
    );

    agHelper.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    //Delete the test data
    ee.ActionContextMenuByEntityName("Page2", "Delete", "Are you sure?");
    agHelper.ValidateNetworkStatus("@deletePage", 200);

    //Should not be able to delete ds until app is published again
    //coz if app is published & shared then deleting ds may cause issue, So!
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.DeleteDatasouceFromActiveTab(dsName as string, 409);
    });

    deployMode.DeployApp();
    agHelper.NavigateBacktoEditor();
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.DeleteDatasouceFromActiveTab(dsName as string, 200);
    });
  });

  it.only("2. Create new app and Generate CRUD page using a new datasource", () => {
    homePage.NavigateToHome();
    homePage.CreateNewApplication();
    agHelper.GetNClick(homePage._buildFromDataTableActionCard);
    agHelper.GetNClick(dataSources._selectDatasourceDropdown);
    agHelper.GetNClickByContains(
      dataSources._dropdownOption,
      "Connect New Datasource",
    );

    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.CreatePlugIn("MongoDB");
      guid = uid;
      agHelper.RenameWithInPane("Mongo " + guid, false);
      dataSources.FillMongoDSForm();
      dataSources.TestSaveDatasource();
      cy.wrap("Mongo " + guid).as("dsName");
    });

    agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.WaitUntilToastDisappear("datasource updated successfully");
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "friends");

    GenerateCRUDNValidateDeployPage(
      "<p>Monica's old friend Rachel moves in with her after leaving her fiancé.</p>",
      `1994-09-22`,
      "http://www.tvmaze.com/episodes/40646/friends-1x01-the-one-where-it-all-began",
      11,
    );

    agHelper.NavigateBacktoEditor();
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("3. Generate CRUD page from datasource present in ACTIVE section", function() {
    dataSources.NavigateFromActiveDS(dsName, false);
    agHelper.ValidateNetworkStatus("@getDatasourceStructure");
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "coffeeCafe");

    GenerateCRUDNValidateDeployPage("", "", "Washington, US", 11);

    agHelper.NavigateBacktoEditor();
    table.WaitUntilTableLoad(1, 0);
    //Delete the test data
    ee.expandCollapseEntity("PAGES");
    ee.ActionContextMenuByEntityName("CoffeeCafe", "Delete", "Are you sure?");
    agHelper.ValidateNetworkStatus("@deletePage", 200);
  });

  it.only("4. Create new CRUD collection 'AuthorNAwards' & refresh Entity Explorer to find the new table", () => {
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
      "_id" : 3,
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
  },
  {
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
      "_id" : 10,
      "name" : {
          "first" : "Martin",
          "last" : "Odersky"
      },
      "contribs" : [
          "Scala"
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
    agHelper.Sleep(2000);
    dataSources.RunQuery();
    agHelper.ActionContextMenuWithInPane("Delete");

    ee.expandCollapseEntity(dsName);
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(ee._entityNameInExplorer("AuthorNAwards"));
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
