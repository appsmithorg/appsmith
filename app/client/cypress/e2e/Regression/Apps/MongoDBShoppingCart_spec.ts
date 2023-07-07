const appPage = require("../../../locators/PgAdminlocators.json");
import {
  agHelper,
  assertHelper,
  deployMode,
  homePage,
  gitSync,
  dataSources,
} from "../../../support/Objects/ObjectsCore";

describe("Shopping cart App", function () {
  let datasourceName: string, repoName: any;

  before(() => {
    homePage.NavigateToHome();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      homePage.CreateNewWorkspace("MongoDBShop" + uid);
      homePage.CreateAppInWorkspace("MongoDBShop" + uid, "MongoDBShopApp");
      agHelper.AddDsl("mongoAppdsl");
    });
    dataSources.CreateDataSource("Mongo");
    cy.get("@saveDatasource").then((httpResponse: any) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("1. Create MongoDB datasource and add Insert, Find, Update and Delete queries", function () {
    dataSources.CreateQueryAfterDSSaved("", "GetProduct");
    dataSources.EnterJSContext({
      fieldProperty: dataSources._mongoCollectionPath,
      fieldLabel: "Collection",
      fieldValue: "Productnames",
    });
    // GetProduct query to fetch all products
    agHelper.AssertAutoSave();
    // EditProducts query to update the cart
    dataSources.CreateQueryFromOverlay(datasourceName, "", "EditProducts");
    dataSources.ValidateNSelectDropdown(
      "Commands",
      "Find document(s)",
      "Update document(s)",
    );
    dataSources.EnterJSContext({
      fieldProperty: dataSources._mongoCollectionPath,
      fieldLabel: "Collection",
      fieldValue: "Productnames",
    });
    agHelper.EnterValue('{"title": "{{Table1.selectedRow.title}}"}', {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Query",
    });
    agHelper.EnterValue(
      `{"title" : "{{title.text}}",
    "description" :"{{description.text}}",
    "price" : {{price.text}},
    "quantity":{{quantity.text}}}`,
      {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Update",
      },
    );

    agHelper.AssertAutoSave();

    // AddProducts query to add to cart
    dataSources.CreateQueryFromOverlay(datasourceName, "", "AddProduct");
    dataSources.ValidateNSelectDropdown(
      "Commands",
      "Find document(s)",
      "Insert document(s)",
    );
    dataSources.EnterJSContext({
      fieldProperty: dataSources._mongoCollectionPath,
      fieldLabel: "Collection",
      fieldValue: "Productnames",
    });
    const documentText = [
      {
        title: "{{Title.text}}",
        description: "{{Description.text}}",
        price: "{{Price.text}}",
        quantity: "{{Quantity.text}}",
      },
    ];
    agHelper.EnterValue(JSON.stringify(documentText), {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Documents",
    });

    agHelper.AssertAutoSave();

    // Delete product
    dataSources.CreateQueryFromOverlay(datasourceName, "", "DeleteProduct");
    dataSources.ValidateNSelectDropdown(
      "Commands",
      "Find document(s)",
      "Delete document(s)",
    );
    dataSources.EnterJSContext({
      fieldProperty: dataSources._mongoCollectionPath,
      fieldLabel: "Collection",
      fieldValue: "Productnames",
    });
    agHelper.EnterValue('{"title":"{{Table1.selectedRow.title}}"}', {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Query",
    });

    agHelper.AssertAutoSave();
    deployMode.DeployApp(appPage.bookname);
  });

  it("2. Perform CRUD operations and validate data", function () {
    // Adding the books to the Add cart form
    agHelper.GetNClick(appPage.bookname);
    //Wait for element to be in DOM
    agHelper.Sleep(3000);
    agHelper.AssertElementLength(appPage.inputValues, 9);
    agHelper.UpdateInput(appPage.bookname, "Atomic habits", true);
    agHelper.UpdateInput(appPage.bookgenre, "Self help", true);
    agHelper.UpdateInput(appPage.bookprice, "200", true);
    agHelper.UpdateInput(appPage.bookquantity, "2", true);
    agHelper.GetNClick(appPage.addButton, 0, true);
    assertHelper.AssertNetworkStatus("@postExecute");
    agHelper.GetNClick(appPage.bookname);
    agHelper.UpdateInput(appPage.bookname, "A man called ove", true);
    agHelper.UpdateInput(appPage.bookgenre, "Fiction", true);
    agHelper.UpdateInput(appPage.bookprice, "100", true);
    agHelper.UpdateInput(appPage.bookquantity, "1", true);
    agHelper.GetNClick(appPage.addButton, 0, true);
    assertHelper.AssertNetworkStatus("@postExecute");
    // Deleting the book from the cart
    agHelper.GetNClick(appPage.deleteButton, 1, false);
    assertHelper.AssertNetworkStatus("@postExecute");
    agHelper.Sleep(3000);
    assertHelper.AssertNetworkStatus("@postExecute");

    // validating that the book is deleted
    agHelper.AssertElementLength(appPage.deleteButton + "/parent::div", 1);
    // Updating the book quantity from edit cart
    agHelper.UpdateInput(appPage.editbookquantity, "3", true);
    agHelper.GetNClick(appPage.editButton, 0, true);

    //Wait for all post execute calls to finish
    agHelper.Sleep(3000);
    agHelper.AssertNetworkExecutionSuccess("@postExecute");
    // validating updated value in the cart
    agHelper
      .GetElement(dataSources._selectedRow)
      .children()
      .eq(3)
      .should("have.text", "3");
  });

  it("3. Connect the application to git and validate data in deploy mode and edit mode", function () {
    deployMode.NavigateBacktoEditor();
    gitSync.CreateNConnectToGit(repoName);
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
    cy.latestDeployPreview();
    agHelper
      .GetElement(dataSources._selectedRow)
      .children()
      .eq(0)
      .should("have.text", "A man called ove");
    deployMode.NavigateBacktoEditor();
    agHelper
      .GetElement(dataSources._selectedRow)
      .children()
      .eq(0)
      .should("have.text", "A man called ove");
  });

  after(() => {
    //clean up
    gitSync.DeleteTestGithubRepo(repoName);
  });
});
