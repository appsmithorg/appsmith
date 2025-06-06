import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

const generatePage = require("../../../../locators/GeneratePage.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import {
  dataSources,
  entityExplorer,
  agHelper,
  entityItems,
  assertHelper,
  debuggerHelper,
} from "../../../../support/Objects/ObjectsCore";

let datasourceName;

describe(
  "Validate CRUD queries for Postgres along with UI flow verifications",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    // afterEach(function() {
    //   if (this.currentTest.state === "failed") {
    //     Cypress.runner.stop();
    //   }
    // });

    it("1. Creates a new Postgres datasource", function () {
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        datasourceName = $dsName;
      });
    });

    it("2. Create & runs existing table data with dynamic binding and deletes the query", () => {
      AppSidebar.navigate(AppSidebarButton.Editor);
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      cy.dragAndDropToCanvas("tablewidgetv2", { x: 100, y: 100 });
      dataSources.CreateQueryForDS(datasourceName);
      agHelper.TypeDynamicInputValueNValidate(
        "select * from users limit {{Table1.pageSize}} OFFSET {{((Table1.pageNo - 1)*Table1.pageSize)}}",
        ".CodeEditorTarget",
        true,
        "select * from users limit $1 OFFSET $2",
      );
      cy.runAndDeleteQuery();
    });

    it("3. Create new CRUD Table and populate", () => {
      dataSources.CreateQueryForDS(datasourceName);

      let tableCreateQuery = `CREATE TABLE public.users_crud (
      id integer NOT NULL,
      name character varying,
      status character varying,
      gender character varying,
      email character varying,
      address text,
      role text);

      insert into public.users_crud (id, name, status, gender, email, address, role) values
      (1, 'CRUD User1', 'PENDING', 'Male', 'cruduser1@ihg.com', '19624 Scofield Way', 'User'),
      (2, 'CRUD User2', 'IN PROGRESS', 'Male','cruduser2@ihg.com', '19624 Scofield Way', 'Editor'),
      (3, 'CRUD User3', 'APPROVED', 'Female','cruduser3@ihg.com', '19624 Scofield Way', 'Admin'),
      (4, 'CRUD User4', 'PENDING', 'Male', 'cruduser4@ihg.com', '19624 Scofield Way', 'User'),
      (5, 'CRUD User5', 'IN PROGRESS', 'Male','cruduser5@ihg.com', '19624 Scofield Way', 'Editor'),
      (6, 'CRUD User6', 'APPROVED', 'Female','cruduser6@ihg.com', '19624 Scofield Way', 'Admin'),
      (7, 'CRUD User7', 'PENDING', 'Male', 'cruduser7@ihg.com', '19624 Scofield Way', 'User'),
      (8, 'CRUD User8', 'IN PROGRESS', 'Male','cruduser8@ihg.com', '19624 Scofield Way', 'Editor'),
      (9, 'CRUD User9', 'APPROVED', 'Female','cruduser9@ihg.com', '19624 Scofield Way', 'Admin'),
      (10, 'CRUD User10', 'PENDING', 'Male', 'cruduser10@ihg.com', '19624 Scofield Way', 'User'),
      (11, 'CRUD User11', 'IN PROGRESS', 'Male','cruduser11@ihg.com', '19624 Scofield Way', 'Editor'),
      (12, 'CRUD User12', 'APPROVED', 'Female','cruduser12@ihg.com', '19624 Scofield Way', 'Admin'),
      (13, 'CRUD User13', 'PENDING', 'Male', 'cruduser13@ihg.com', '19624 Scofield Way', 'User'),
      (14, 'CRUD User14', 'IN PROGRESS', 'Male','cruduser14@ihg.com', '19624 Scofield Way', 'Editor'),
      (15, 'CRUD User15', 'APPROVED', 'Female','cruduser15@ihg.com', '19624 Scofield Way', 'Admin'),
      (16, 'CRUD User16', 'PENDING', 'Male', 'cruduser16@ihg.com', '19624 Scofield Way', 'User'),
      (17, 'CRUD User17', 'IN PROGRESS', 'Male','cruduser17@ihg.com', '19624 Scofield Way', 'Editor'),
      (18, 'CRUD User18', 'APPROVED', 'Female','cruduser18@ihg.com', '19624 Scofield Way', 'Admin'),
      (19, 'CRUD User19', 'PENDING', 'Male', 'cruduser19@ihg.com', '19624 Scofield Way', 'User'),
      (20, 'CRUD User20', 'IN PROGRESS', 'Male','cruduser20@ihg.com', '19624 Scofield Way', 'Editor'),
      (21, 'CRUD User21', 'APPROVED', 'Female','cruduser21@ihg.com', '19624 Scofield Way', 'Admin'),
      (22, 'CRUD User22', 'PENDING', 'Male', 'cruduser22@ihg.com', '19624 Scofield Way', 'User'),
      (23, 'CRUD User23', 'IN PROGRESS', 'Male','cruduser23@ihg.com', '19624 Scofield Way', 'Editor'),
      (24, 'CRUD User24', 'APPROVED', 'Female','cruduser24@ihg.com', '19624 Scofield Way', 'Admin'),
      (25, 'CRUD User25', 'PENDING', 'Male', 'cruduser25@ihg.com', '19624 Scofield Way', 'User'),
      (26, 'CRUD User26', 'IN PROGRESS', 'Male','cruduser26@ihg.com', '19624 Scofield Way', 'Editor'),
      (27, 'CRUD User27', 'APPROVED', 'Female','cruduser27@ihg.com', '19624 Scofield Way', 'Admin'),
      (28, 'CRUD User28', 'PENDING', 'Male', 'cruduser28@ihg.com', '19624 Scofield Way', 'User'),
      (29, 'CRUD User29', 'IN PROGRESS', 'Male','cruduser29@ihg.com', '19624 Scofield Way', 'Editor'),
      (30, 'CRUD User30', 'APPROVED', 'Female','cruduser30@ihg.com', '19624 Scofield Way', 'Admin');`;

      //cy.typeValueNValidate(tableCreateQuery);//Since type method is slow for such big text - using paste!
      cy.get(".CodeMirror textarea").focus().paste(tableCreateQuery);
      cy.EvaluateCurrentValue(tableCreateQuery);
      cy.wait(3000);
      cy.runAndDeleteQuery(); //exeute actions - 200 response is verified in this method
    });

    it("4. Validate Select record from Postgress datasource", () => {
      dataSources.CreateQueryForDS(
        datasourceName,
        "select * from public.users_crud",
      );

      // cy.xpath(queryLocators.codeTextArea).paste(selectQuery);
      //cy.EvaluateCurrentValue(selectQuery);

      cy.runAndDeleteQuery(); //exeute actions - 200 response is verified in this method
    });

    it("5. Validate Create/Insert record into Postgress datasource", () => {
      dataSources.CreateQueryForDS(
        datasourceName,
        "INSERT INTO public.users_crud (id, name, gender, email) VALUES (31, 'CRUD User11','Male','cruduser31@ihg.com');",
      );
      cy.runAndDeleteQuery();
    });

    it("6. Validate Update record into Postgress datasource", () => {
      dataSources.CreateQueryForDS(
        datasourceName,
        "UPDATE public.users_crud SET status = 'PENDING', role = 'Viewer' WHERE id = 31;",
      );
      cy.runAndDeleteQuery();
    });

    it("7. Validate Delete record from Postgress datasource", () => {
      dataSources.CreateQueryForDS(
        datasourceName,
        "DELETE FROM public.users_crud WHERE id = 31;",
      );
      cy.runAndDeleteQuery();
    });

    it("8. Verify generation of NewPage from New table & perform Add/Update/Delete operations", function () {
      //Verifying Select from UI
      EditorNavigation.SelectEntityByName(
        datasourceName,
        EntityType.Datasource,
      );
      dataSources.RefreshDatasourceSchema();
      dataSources.SelectTableFromPreviewSchemaList("public.users_crud");
      agHelper.GetNClick(dataSources._datasourceCardGeneratePageBtn);

      cy.wait("@replaceLayoutWithCRUDPage").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        201,
      );

      cy.wait("@getActions");

      cy.wait("@postExecute").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      ); //This verifies the Select on the table, ie page is created fine
      assertHelper.AssertNetworkStatus("@updateLayout", 200);

      cy.ClickGotIt();
      cy.wait(3000);
      //Verifying Update from UI
      cy.xpath(generatePage.selectRowinTable)
        .eq(0)
        .scrollIntoView()
        .click({ force: true });

      //Commenting below section as it will be replaced with new JSON Form CRUD!
      // cy.xpath(generatePage.currentStatusField)
      //   .scrollIntoView()
      //   .clear()
      //   .wait(500)
      //   .type("APPROVED");

      // cy.get(generatePage.updateBtn)
      //   .closest("div")
      //   .eq(1)
      //   .click();

      // cy.wait(8000); //Wait for update call to be success
      // cy.wait("@postExecute").should(
      //   "have.nested.property",
      //   "response.body.responseMeta.status",
      //   200,
      // ); //This verifies the Update on the table

      // //.should("have.nested.property", "response.body.data.request.requestParams.Query.value",);

      // cy.wait(2000);

      // cy.xpath(generatePage.selectRowinTable)
      //   .scrollIntoView()
      //   .should("be.visible")
      //   .click({ force: true });

      // cy.getTableDataSelector("1", "2").then((selector) => {
      //   cy.get(selector + " span span span").should("have.text", "APPROVED");
      // }); //Verifying update is success

      // //verifying Insert from UI
      // cy.xpath(generatePage.addRowIcon)
      //   .scrollIntoView()
      //   .click();
      // // cy.xpath(generatePage.idField).clear().type("31");
      // cy.get(generatePage.idField)
      //   .last()
      //   .children()
      //   .last()
      //   .clear()
      //   .type("31");
      // //  cy.xpath(generatePage.nameField).clear().type("CRUD User31");
      // cy.get(generatePage.nameField)
      //   .last()
      //   .children()
      //   .last()
      //   .clear()
      //   .type("CRUD User31");
      // //  cy.xpath(generatePage.statusField).clear().type("REJECTED");
      // cy.get(generatePage.statusField)
      //   .last()
      //   .children()
      //   .last()
      //   .clear()
      //   .type("REJECTED");
      // //  cy.xpath(generatePage.genderField).clear().type("Male");
      // cy.get(generatePage.genderField)
      //   .last()
      //   .children()
      //   .last()
      //   .clear()
      //   .type("Male");
      // //  cy.xpath(generatePage.emailField)
      // cy.get(generatePage.emailField)
      //   .last()
      //   .children()
      //   .last()
      //   .clear()
      //   .type("curduser31@ihg.com")
      //   .wait(2000); //Waiting for Submit button to get enabled
      // cy.get(generatePage.submitBtn)
      //   .closest("div")
      //   .first()
      //   .click();
      // cy.wait(5000);

      // //cy.get(generatePage.sortByDropdown)
      // //   .last()
      // //   .click(); //Sorting by descending to verify newly added record - also sorting is verified
      // //  cy.xpath(generatePage.descending).click();
      // // cy.wait(2000); //for descending to take effect!
      // // sreach for added row
      // cy.get(generatePage.searchinTable).type("31");
      // cy.xpath(generatePage.currentNameField).should("have.value", "CRUD User31"); //Verifying Addition is success

      // //Verifying Delete from UI
      // cy.xpath(generatePage.deleteofSelectedRow)
      //   .scrollIntoView()
      //   .should("be.visible")
      //   .click({ force: true });
      // cy.get(generatePage.confirmBtn)
      //   .closest("div")
      //   .click()
      //   .wait(2000); //Wait for update call to be success

      // cy.wait("@postExecute").should(
      //   "have.nested.property",
      //   "response.body.responseMeta.status",
      //   200,
      // );
      // // verify table row is deleted

      // cy.xpath(generatePage.currentNameField)
      //   .scrollIntoView()
      //   .should("be.empty"); //Verifying Deletion of id # 31 is success

      // cy.get(generatePage.searchinTable).clear();
    });

    it("9. Validate Deletion of the Newly Created Page", () => {
      dataSources.DeleteDatasourceFromWithinDS(datasourceName, 409);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Public.users_crud",
        action: "Delete",
        entityType: entityItems.Page,
      });
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    });

    it("10. Validate Drop of the Newly Created Table from Postgress datasource", () => {
      let deleteTblQuery = "DROP TABLE public.users_crud;";
      dataSources.CreateQueryForDS(datasourceName, deleteTblQuery);
      dataSources.RunQuery();
      // TODO use the schema on the query itself to check
      dataSources.AssertTableInVirtuosoList(
        datasourceName,
        "public.users_crud",
        false,
      );
      cy.deleteQueryUsingContext();
    });

    it("11. Bug 9425: The application is breaking when user run the query with wrong table name", function () {
      dataSources.CreateQueryForDS(
        datasourceName,
        "select * from public.users limit 10",
      );
      cy.runQuery();
      cy.typeValueNValidate("select * from public.users_crud limit 10");
      cy.onlyQueryRun();
      debuggerHelper.ClickLogsTab();
      debuggerHelper.DoesConsoleLogExist("Failed execution", true, "Query1");
      cy.deleteQueryUsingContext();
    });

    it("12. Bug 14493: The application is breaking when user runs the query with result as empty array", function () {
      dataSources.CreateQueryForDS(
        datasourceName,
        "select * from public.users where name='Ayush1234' ORDER BY id LIMIT 10",
      );
      cy.runQuery();
      cy.deleteQueryUsingContext();
    });

    it("13. Deletes the datasource", () => {
      dataSources.DeleteDatasourceFromWithinDS(datasourceName, [200, 409]);
    });
  },
);
