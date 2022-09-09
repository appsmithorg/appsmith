const dsl = require("../../../fixtures/mongoAppdsl.json");
const datasource = require("../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../locators/QueryEditor.json");
const appPage = require("../../../locators/PgAdminlocators.json");
const formControls = require("../../../locators/FormControl.json");

let repoName;
describe("Shopping cart App", function() {
  let datasourceName;

  before(() => {
    cy.addDsl(dsl);
  });
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create MongoDB datasource and add Insert, Find, Update and Delete queries", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click();
    cy.fillMongoDatasourceForm();
    cy.testSaveDatasource();
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();
    // GetProduct query to fetch all products
    cy.get(queryLocators.createQuery)
      .last()
      .click();
    cy.get(queryLocators.queryNameField).type("GetProduct");
    cy.get(".CodeEditorTarget")
      .first()
      .type("Productnames");
    cy.assertPageSave();
    cy.get(appPage.dropdownChevronLeft).click();
    // EditProducts query to update the cart
    cy.get(queryLocators.createQuery)
      .last()
      .click();
    cy.get(queryLocators.queryNameField).type("EditProducts");

    // Clicking outside to trigger the save
    cy.get("body").click(0, 0);
    cy.TargetDropdownAndSelectOption(
      formControls.commandDropdown,
      "Update Document(s)",
    );
    cy.get(".CodeEditorTarget")
      .first()
      .type("Productnames");
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
    cy.get(queryLocators.createQuery)
      .last()
      .click();
    cy.wait(5000);
    cy.get(queryLocators.queryNameField).type("AddProduct");
    // Clicking outside to trigger the save
    cy.get("body").click(0, 0);
    cy.TargetDropdownAndSelectOption(
      formControls.commandDropdown,
      "Insert Document(s)",
    );
    // cy.get("[data-cy='actionConfiguration.formData.command.data']").click();
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
    cy.get(queryLocators.createQuery)
      .last()
      .click();
    cy.wait(5000);
    cy.get(queryLocators.queryNameField).type("DeleteProduct");
    // Clicking outside to trigger the save
    cy.get("body").click(0, 0);
    cy.TargetDropdownAndSelectOption(
      formControls.commandDropdown,
      "Delete Document(s)",
    );
    // cy.get("[data-cy='actionConfiguration.formData.command.data']").click();
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
    cy.get(appPage.dropdownChevronLeft).click();
  });

  it("2. Perform CRUD operations and validate data", function() {
    // Adding the books to the Add cart form
    cy.xpath(appPage.bookname).type("Atomic habits");
    cy.xpath(appPage.bookgenre).type("Self help");
    cy.xpath(appPage.bookprice).type(200);
    cy.xpath(appPage.bookquantity).type(2);
    cy.get("span:contains('Submit')")
      .closest("div")
      .eq(1)
      .click();
    cy.assertPageSave();
    cy.wait(8000);
    cy.xpath(appPage.bookname)
      .click()
      .type("A man called ove");
    cy.xpath(appPage.bookgenre)
      .click()
      .type("Fiction");
    cy.xpath(appPage.bookprice)
      .click()
      .type(100);
    cy.xpath(appPage.bookquantity)
      .click()
      .type(1);
    cy.get("span:contains('Submit')")
      .closest("div")
      .eq(1)
      .click();
    cy.assertPageSave();
    cy.wait("@postExecute");
    // Deleting the book from the cart
    cy.get(".tableWrap")
      .children()
      .within(() => {
        cy.get("span:contains('Delete')")
          .closest("div")
          .eq(1)
          .click();
        cy.wait("@postExecute");
        cy.wait(5000);

        // validating that the book is deleted
        cy.get("span:contains('Delete')")
          .parent("button")
          .should("have.length", 1);
      });
    // Updating the book quantity from edit cart
    cy.xpath(appPage.editbookquantity)
      .clear()
      .type("3");
    cy.get("span:contains('Submit')")
      .closest("div")
      .eq(0)
      .click();
    cy.assertPageSave();
    cy.wait(5000);
    // validating updated value in the cart
    cy.get(".selected-row")
      .children()
      .eq(3)
      .should("have.text", "3");
  });

  /*it("Connect the appplication to git and validate data in deploy mode and edit mode", function() {
    cy.generateUUID().then((uid) => {
      repoName = uid;
      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
    });
    cy.latestDeployPreview();
    cy.wait(2000)
    cy.get(".selected-row").children().eq(0)
    .should("have.text", "A man called ove");
    cy.get(commonlocators.backToEditor).click();
    cy.get(".selected-row").children().eq(0)
    .should("have.text", "A man called ove");
    cy.wait(1000);
  }) */
});
