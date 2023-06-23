const queryLocators = require("../../../locators/QueryEditor.json");
const appPage = require("../../../locators/PgAdminlocators.json");
const formControls = require("../../../locators/FormControl.json");
import {
  agHelper,
  deployMode,
  homePage,
  gitSync,
  dataSources,
} from "../../../support/Objects/ObjectsCore";

let repoName;
describe.skip("Shopping cart App", function () {
  let datasourceName;

  before(() => {
    homePage.NavigateToHome();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      homePage.CreateNewWorkspace("MongoDBShop" + uid);
      homePage.CreateAppInWorkspace("MongoDBShop" + uid, "MongoDBShopApp");
      cy.fixture("mongoAppdsl").then((val) => {
        agHelper.AddDsl(val);
      });
    });
  });

  it("1. Create MongoDB datasource and add Insert, Find, Update and Delete queries", function () {
    dataSources.CreateDataSource("Mongo");
    cy.get("@saveDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();
    // GetProduct query to fetch all products
    cy.get(queryLocators.createQuery).last().click();
    cy.get(queryLocators.queryNameField).type("GetProduct");
    cy.get(".CodeEditorTarget").first().type("Productnames");
    cy.assertPageSave();
    cy.get(appPage.dropdownChevronLeft).click();
    // EditProducts query to update the cart
    cy.get(queryLocators.createQuery).last().click();
    cy.get(queryLocators.queryNameField).type("EditProducts");

    // Clicking outside to trigger the save
    cy.get("body").click(0, 0);
    cy.TargetDropdownAndSelectOption(
      formControls.commandDropdown,
      "Update document(s)",
    );
    cy.get(".CodeEditorTarget").first().type("Productnames");
    cy.get(".CodeEditorTarget")
      .eq(1)
      .type('{"title": "{{Table1.selectedRow.title}}"}', {
        parseSpecialCharSequences: false,
      });
    cy.get(".CodeEditorTarget")
      .eq(2)
      .type(
        `{"title" : "{{title.text}}",
      "description" :"{{description.text}}",
      "price" : {{price.text}},
      "quantity":{{quantity.text}}`,
        {
          parseSpecialCharSequences: false,
        },
      );
    cy.assertPageSave();
    cy.get(appPage.dropdownChevronLeft).click();
    // Add product query
    cy.get(queryLocators.createQuery).last().click();
    cy.wait(5000);
    cy.get(queryLocators.queryNameField).type("AddProduct");
    // Clicking outside to trigger the save
    cy.get("body").click(0, 0);
    cy.TargetDropdownAndSelectOption(
      formControls.commandDropdown,
      "Insert document(s)",
    );
    // cy.get("[data-testid='actionConfiguration.formData.command.data']").click();
    // cy.get(".t--dropdown-option")
    //   .eq(1)
    //   .click();
    const documentText = [
      {
        title: "{{Title.text}}",
        description: "{{Description.text}}",
        price: "{{Price.text}}",
        quantity: "{{Quantity.text}}",
      },
    ];
    cy.get(".CodeEditorTarget")
      .first()
      .type("Productnames", { parseSpecialCharSequences: false });
    cy.get(".CodeEditorTarget")
      .eq(1)
      .type(JSON.stringify(documentText), { parseSpecialCharSequences: false });
    cy.assertPageSave();
    cy.get(appPage.dropdownChevronLeft).click();
    // delete product
    cy.get(queryLocators.createQuery).last().click();
    cy.wait(5000);
    cy.get(queryLocators.queryNameField).type("DeleteProduct");
    // Clicking outside to trigger the save
    cy.get("body").click(0, 0);
    cy.TargetDropdownAndSelectOption(
      formControls.commandDropdown,
      "Delete document(s)",
    );
    // cy.get("[data-testid='actionConfiguration.formData.command.data']").click();
    // cy.get(".t--dropdown-option")
    //   .eq(3)
    //   .click();
    cy.get(".CodeEditorTarget")
      .first()
      .type("Productnames", { parseSpecialCharSequences: false });
    cy.get(".CodeEditorTarget")
      .eq(1)
      .type('{"title":"{{Table1.selectedRow.title}}"}', {
        parseSpecialCharSequences: false,
      });
    cy.assertPageSave();

    cy.get(appPage.dropdownChevronLeft).click();
    cy.get(".t--back-button").click();
    deployMode.DeployApp(appPage.bookname);
  });

  it("2. Perform CRUD operations and validate data", function () {
    // Adding the books to the Add cart form
    agHelper.GetNClick(appPage.bookname);
    //Wait for element to be in DOM
    agHelper.Sleep(3000);
    agHelper.UpdateInput(appPage.bookname, "Atomic habits", true);
    agHelper.UpdateInput(appPage.bookgenre, "Self help", true);
    agHelper.UpdateInput(appPage.bookprice, 200, true);
    agHelper.UpdateInput(appPage.bookquantity, 2, true);
    agHelper.GetNClick(appPage.addButton, 0, true);
    cy.wait("@postExecute");
    cy.wait(3000);
    agHelper.UpdateInput(appPage.bookname, "A man called ove", true);
    agHelper.UpdateInput(appPage.bookgenre, "Fiction", true);
    agHelper.UpdateInput(appPage.bookprice, 100, true);
    agHelper.UpdateInput(appPage.bookquantity, 1, true);
    agHelper.GetNClick(appPage.addButton, 0, true);
    cy.wait("@postExecute");
    // Deleting the book from the cart
    cy.get(".tableWrap")
      .children()
      .first()
      .within(() => {
        agHelper.GetNClick(appPage.deleteButton, 1, false);
        cy.wait("@postExecute");
        cy.wait(5000);
        cy.wait("@postExecute")
          .its("response.body.responseMeta.status")
          .should("eq", 200);

        // validating that the book is deleted
        cy.get("span:contains('Delete')")
          .parent("button")
          .should("have.length", 1);
      });
    // Updating the book quantity from edit cart
    agHelper.UpdateInput(appPage.editbookquantity, 3, true);
    agHelper.GetNClick(appPage.editButton, 0, true);

    //Wait for all post execute calls to finish
    agHelper.Sleep(3000);
    agHelper.AssertNetworkExecutionSuccess("@postExecute");
    cy.get("@postExecute.all").its("length").should("be.above", 8);
    cy.get("@postExecute.last")
      .its("response.body")
      .then((user) => {
        expect(user.data.body[0].quantity).to.equal("3");
      });
    // validating updated value in the cart
    cy.get(".selected-row").children().eq(3).should("have.text", "3");
  });

  it("3. Connect the appplication to git and validate data in deploy mode and edit mode", function () {
    deployMode.NavigateBacktoEditor();
    gitSync.CreateNConnectToGit(repoName);
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
    cy.latestDeployPreview();
    cy.wait(2000);
    cy.get(".selected-row")
      .children()
      .eq(0)
      .should("have.text", "A man called ove");
    deployMode.NavigateBacktoEditor();
    cy.get(".selected-row")
      .children()
      .eq(0)
      .should("have.text", "A man called ove");
    cy.wait(1000);
  });

  after(() => {
    //clean up
    gitSync.DeleteTestGithubRepo(repoName);
  });
});
