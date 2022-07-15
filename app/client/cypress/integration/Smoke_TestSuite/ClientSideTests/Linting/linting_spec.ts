import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer,
  apiPage = ObjectsRegistry.ApiPage,
  agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane;

const setUpMySQL = () => {
  if (Cypress.env("MySQL") === 0) {
    cy.log("MySQL DB is not found. Using intercept");
    dataSources.StartInterceptRoutesForMySQL();
  } else cy.log("MySQL DB is found, hence using actual DB");
};

const successMessage = "Successful Trigger";
const errorMessage = "Unsuccessful Trigger";

const clickButtonAndAssertLintError = (
  shouldExist: boolean,
  shouldWait = false,
) => {
  agHelper.Sleep(2000);
  // Check for presence/ absence of lint error
  ee.SelectEntityByName("Button1", "WIDGETS");
  // Sometimes wait for page to switch
  shouldWait && agHelper.Sleep(2000);
  if (shouldExist) {
    agHelper.AssertElementExist(locator._lintErrorElement);
    agHelper.ClickButton("Submit");
    agHelper.ValidateToastMessage(errorMessage);
  } else {
    agHelper.AssertElementAbsence(locator._lintErrorElement);
    agHelper.ClickButton("Submit");
    agHelper.ValidateToastMessage(successMessage);
  }

  //Reload and Check for presence/ absence of lint error
  agHelper.RefreshPage();
  ee.SelectEntityByName("Button1", "WIDGETS");
  shouldExist
    ? agHelper.AssertElementExist(locator._lintErrorElement)
    : agHelper.AssertElementAbsence(locator._lintErrorElement);
};

const createMySQLDatasourceQuery = () => {
  let guid = "";
  // Create mySql datasource
  agHelper.GenerateUUID();
  cy.get("@guid").then((uid) => {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("MySQL");
    guid = (uid as unknown) as string;
    agHelper.RenameWithInPane("MySQL " + guid, false);
    dataSources.FillMySqlDSForm();
    dataSources.TestSaveDatasource();

    // Create Query
    dataSources.NavigateFromActiveDS("MySQL " + guid, true);
    agHelper.GetNClick(dataSources._templateMenu);

    const tableCreateQuery = `CREATE TABLE Stores(
      store_id         INTEGER  NOT NULL PRIMARY KEY
     ,name          VARCHAR(36) NOT NULL
     ,store_status  VARCHAR(1) NOT NULL
     ,store_address VARCHAR(96) NOT NULL
     ,store_secret_code  VARCHAR(16)
   );
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2106,'Hillstreet News and Tobacco','A','2217 College Cedar Falls, IA 506130000 (42.51716928600007, -92.45583783899997)',NULL);
   INSERT INTO Stores(store_id,name,store_status,store_address,store_secret_code) VALUES (2112,'Mike''s Liquors','I','407 Sharp St.Glenwood, IA 515340000 (41.04631266100006, -95.74218014299998)',NULL);`;
    dataSources.EnterQuery(tableCreateQuery);
  });
};

describe("Linting", () => {
  before(() => {
    ee.DragDropWidgetNVerify("buttonwidget", 300, 300);
    ee.NavigateToSwitcher("explorer");
  });

  it("1. TC 1927 - Shows correct lint error when Api is deleted or created", () => {
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
      "onClick",
      `{{function(){
        try{
          Api1.run()
          showAlert("${successMessage}")
        }catch(e){
          showAlert("${errorMessage}")
        }
      }()}}`,
      true,
      true,
    );

    propPane.UpdatePropertyFieldValue("Tooltip", "{{Api1.name}}");
    clickButtonAndAssertLintError(true);

    // create Api1
    apiPage.CreateAndFillApi(
      "https://jsonplaceholder.typicode.com/",
      "Api1",
      "GET",
    );

    clickButtonAndAssertLintError(false);

    // Delete Api and assert that lint error shows
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("Api1", "Delete", "Are you sure?");

    clickButtonAndAssertLintError(true);

    // Re-create Api1
    apiPage.CreateAndFillApi(
      "https://jsonplaceholder.typicode.com/",
      "Api1",
      "GET",
    );

    clickButtonAndAssertLintError(false);
  });
  it("2. TC 1927 Cont'd - Doesn't show lint errors when Api is renamed", () => {
    ee.SelectEntityByName("Api1", "QUERIES/JS");
    agHelper.RenameWithInPane("Api2");

    clickButtonAndAssertLintError(false);

    ee.SelectEntityByName("Api2", "QUERIES/JS");
    agHelper.RenameWithInPane("Api1");

    clickButtonAndAssertLintError(false);
  });
  it("3. TC 1929 - Shows correct lint error when JSObject is deleted or created", () => {
    ee.SelectEntityByName("Button1", "WIDGETS");
    propPane.UpdatePropertyFieldValue(
      "onClick",
      `{{function(){
      try{
        JSObject1.myFun1()
        showAlert("${successMessage}")
      }catch(e){
        showAlert("${errorMessage}")
      }
    }()}}`,
    );
    propPane.UpdatePropertyFieldValue("Tooltip", `{{JSObject1.myVar1}}`);

    clickButtonAndAssertLintError(true);

    jsEditor.CreateJSObject(
      `export default {
        myVar1: "name",
        myVar2: "test",
        myFun1: () => {
            //write code here
        },
        myFun2: async () => {
            //use async-await or promises
        }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    clickButtonAndAssertLintError(false);
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("JSObject1", "Delete", "Are you sure?");
    ee.SelectEntityByName("Button1", "WIDGETS");

    clickButtonAndAssertLintError(true);

    // Re-create JSObject, lint error should be gone
    jsEditor.CreateJSObject(
      `export default {
        myVar1: "test",
        myVar2: "name",
        myFun1: () => {
            //write code here
        },
        myFun2: async () => {
            //use async-await or promises
        }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    clickButtonAndAssertLintError(false);
  });
  it("4. TC 1929 Cont'd -Doesn't show lint error when JSObject is renamed", () => {
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.SelectEntityByName("JSObject1", "QUERIES/JS");
    jsEditor.RenameJSObjFromPane("JSObject2");
    clickButtonAndAssertLintError(false, true);
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.SelectEntityByName("JSObject2", "QUERIES/JS");
    jsEditor.RenameJSObjFromPane("JSObject1");
    clickButtonAndAssertLintError(false, true);
  });

  it("5. TC 1928 - Shows correct lint error with Query is created or Deleted", () => {
    setUpMySQL();
    ee.SelectEntityByName("Button1", "WIDGETS");
    propPane.UpdatePropertyFieldValue(
      "onClick",
      `{{function(){
      try{
        Query1.run()
        showAlert("${successMessage}")
      }catch(e){
        showAlert("${errorMessage}")
      }
    }()}}`,
    );
    propPane.UpdatePropertyFieldValue("Tooltip", `{{Query1.name}}`);
    clickButtonAndAssertLintError(true);

    createMySQLDatasourceQuery();
    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);

    // Delete
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("Query1", "Delete", "Are you sure?");
    clickButtonAndAssertLintError(true);

    // Recreate Query
    createMySQLDatasourceQuery();
    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);
  });

  it("6. 5. TC 1928 Cont'd - Shows correct lint error when Query is renamed", () => {
    setUpMySQL();
    ee.SelectEntityByName("Query1", "QUERIES/JS");
    agHelper.RenameWithInPane("Query2");

    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);

    ee.SelectEntityByName("Query2", "QUERIES/JS");
    agHelper.RenameWithInPane("Query1");

    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);
  });
  it("7. TC 1930 - Shows correct lint error with multiple entities in triggerfield", () => {
    setUpMySQL();
    ee.SelectEntityByName("Button1", "WIDGETS");
    propPane.UpdatePropertyFieldValue(
      "onClick",
      `{{function(){
        try{
          Api1.run(); JSObject1.myFun1(); JSObject1.myFun2(); Query1.run()
          showAlert("${successMessage}")
        }catch(e){
          showAlert("${errorMessage}")
        }
      }()}}`,
    );
    propPane.UpdatePropertyFieldValue(
      "Tooltip",
      `{{Api1.name + JSObject1.myVar1 + Query1.name}}`,
    );

    clickButtonAndAssertLintError(false);

    // Delete all
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("JSObject1", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Api1", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Query1", "Delete", "Are you sure?");
    clickButtonAndAssertLintError(true);

    // ReCreate all
    jsEditor.CreateJSObject(
      `export default {
          myVar1: "name",
          myVar2: "test",
          myFun1: () => {
              //write code here
          },
          myFun2: async () => {
              //use async-await or promises
          }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    apiPage.CreateAndFillApi(
      "https://jsonplaceholder.typicode.com/",
      "Api1",
      "GET",
    );

    createMySQLDatasourceQuery();

    clickButtonAndAssertLintError(false);
  });
});
