import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const queryLocators = require("../../../../locators/QueryEditor.json");
const generatePage = require("../../../../locators/GeneratePage.json");
const formControls = require("../../../../locators/FormControl.json");

import {
  agHelper,
  entityExplorer,
  homePage,
  dataSources,
  entityItems,
  assertHelper,
  locators,
  apiPage,
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";

let datasourceName;

describe(
  "Validate Mongo query commands",
  { tags: ["@tag.Datasource", "@tag.Sanity"] },
  function () {
    // afterEach(function() {
    //   if (this.currentTest.state === "failed") {
    //     Cypress.runner.stop();
    //   }
    // });

    // afterEach(() => {
    //   if (queryName)
    //     cy.actionContextMenuByEntityName(queryName);
    // });

    before("Creates a new Mongo datasource", function () {
      dataSources.CreateDataSource("Mongo");
      cy.get("@dsName").then(($dsName) => {
        datasourceName = $dsName;
        dataSources.CreateQueryAfterDSSaved();
      });
    });

    it("1. Validate Raw query command, run and then delete the query", function () {
      // cy.get("@getPluginForm").should(
      //   "have.nested.property",
      //   "response.body.responseMeta.status",
      //   200,
      // );

      cy.ValidateAndSelectDropdownOption(
        formControls.commandDropdown,
        "Find document(s)",
        "Raw",
      );
      agHelper.GetNClick(dataSources._templateMenu);

      // cy.get(".CodeMirror textarea")
      //   .first()
      //   .focus()
      //   .type(`{"find": "listingAndReviews","limit": 10}`, {
      //     parseSpecialCharSequences: false,
      //   });
      // cy.EvaluateCurrentValue(`{"find": "listingAndReviews","limit": 10}`);

      dataSources.EnterQuery(`{"find": "listingAndReviews","limit": 10}`);
      agHelper.FocusElement(locators._codeMirrorTextArea);
      dataSources.RunQuery();
      dataSources.CheckResponseRecordsCount(10);
      cy.deleteQueryUsingContext();
    });

    it("2. Validate Find documents command & Run and then delete the query", function () {
      dataSources.CreateQueryForDS(datasourceName);
      dataSources.SetQueryTimeout(20000);

      //cy.xpath(queryLocators.findDocs).should("exist"); //Verifying update is success or below line
      //cy.expect(queryLocators.findDocs).to.exist;

      assertHelper.AssertNetworkStatus("@trigger");
      cy.ValidateAndSelectDropdownOption(
        formControls.commandDropdown,
        "Find document(s)",
      );

      dataSources.EnterJSContext({
        fieldLabel: "Collection",
        fieldValue: "listingAndReviews",
      });
      dataSources.RunQuery();
      dataSources.CheckResponseRecordsCount(10);

      agHelper.EnterValue("{beds : {$lte: 2}}", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Query",
      });
      dataSources.RunQuery();
      dataSources.CheckResponseRecordsCount(10);

      agHelper.EnterValue("{number_of_reviews: -1}", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Sort",
      }); //sort descending
      dataSources.RunQuery();
      dataSources.CheckResponseRecordsCount(10);

      agHelper.EnterValue("{house_rules: 1, description:1}", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Projection",
      }); //Projection field
      dataSources.RunQuery();

      agHelper.EnterValue("5", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Limit",
      }); //Limit field

      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.body[0].description).to.contains(
          "The ideal apartment to visit the magnificent city of Porto and the northern region of Portugal, with family or with a couple of friends",
          "Response is not as expected for Find commmand with multiple conditions",
        );
      });
      dataSources.CheckResponseRecordsCount(5);

      agHelper.EnterValue("2", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Skip",
      });
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.body[0].description).to.contains(
          "My place is close to the beach, family-friendly activities, great views, and a short drive to art and culture, and restaurants and dining",
          "Response is not as expected for Find commmand with multiple conditions",
        );
      });
      dataSources.CheckResponseRecordsCount(5);
      cy.deleteQueryUsingContext();
    });

    it("3. Validate Count command & Run and then delete the query", function () {
      dataSources.CreateQueryForDS(datasourceName);
      assertHelper.AssertNetworkStatus("@trigger");
      cy.ValidateAndSelectDropdownOption(
        formControls.commandDropdown,
        "Find document(s)",
        "Count",
      );
      dataSources.EnterJSContext({
        fieldLabel: "Collection",
        fieldValue: "listingAndReviews",
      });
      dataSources.RunQuery();
      agHelper.EnterValue("{guests_included : {$gte: 2}}", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Query",
      });
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.body.n).to.be.above(
          0,
          "Response is not as expected for Count commmand",
        );
      });
      cy.deleteQueryUsingContext();
    });

    it("4. Validate Distinct command & Run and then delete the query", function () {
      dataSources.CreateQueryForDS(datasourceName);
      assertHelper.AssertNetworkStatus("@trigger");
      cy.ValidateAndSelectDropdownOption(
        formControls.commandDropdown,
        "Find document(s)",
        "Distinct",
      );
      dataSources.EnterJSContext({
        fieldLabel: "Collection",
        fieldValue: "listingAndReviews",
      });
      agHelper.EnterValue("{price : {$gte: 100}}", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Query",
      });
      agHelper.EnterValue("property_type", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Key",
      });
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.body.values[0]).to.eq(
          "Aparthotel",
          "Response is not as expected for Distint commmand",
        );
      });
      cy.deleteQueryUsingContext();
    });

    it("5. Validate Aggregate command & Run and then delete the query", function () {
      dataSources.CreateQueryForDS(datasourceName);
      assertHelper.AssertNetworkStatus("@trigger");
      cy.ValidateAndSelectDropdownOption(
        formControls.commandDropdown,
        "Find document(s)",
        "Aggregate",
      );
      dataSources.EnterJSContext({
        fieldLabel: "Collection",
        fieldValue: "listingAndReviews",
      });
      agHelper.EnterValue(`[{ $project: { count: { $size:"$amenities" }}}]`, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Array of pipelines",
      });

      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ request, response }) => {
        // cy.log(request.method + ": is req.method")
        //expect(request.method).to.equal('POST')
        expect(response.body.data.body[0].count).to.be.above(
          0,
          "Response is not as expected for Aggregate commmand",
        );
        // it is good practice to add message to the assertion
        // expect(req, 'has duration in ms').to.have.property('duration').and.be.a('number')
      });
      cy.deleteQueryUsingContext();
    });

    it("6. Verify generation of NewPage from collection [Select] + Bug 12162", function () {
      //Verifying Select from UI
      cy.NavigateToDSGeneratePage(datasourceName);
      agHelper.Sleep(3000); //giving some time for options to load
      cy.get(generatePage.selectTableDropdown).click();
      cy.get(generatePage.dropdownOption)
        //.first()
        .contains("listingAndReviews")
        .scrollIntoView()
        .should("be.visible")
        .click();

      cy.get(generatePage.generatePageFormSubmitBtn).click();

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

      cy.ClickGotIt();

      //Check if table is loaded & CRUD is success

      cy.get(generatePage.selectedRow).should("exist");
      // cy.get(generatePage.updateBtn)
      //   .closest("button")
      //   .then((selector) => {
      //     cy.get(selector)
      //       .invoke("attr", "class")
      //       .then((classes) => {
      //         cy.log("classes are:" + classes);
      //         expect(classes).not.contain("bp3-disabled");
      //       });
      //   });
    });

    it("7. Validate Deletion of the Newly Created Page", () => {
      dataSources.DeleteDatasourceFromWithinDS(datasourceName, 409);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "ListingAndReviews",
        action: "Delete",
        entityType: entityItems.Page,
      });
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    });

    it("8. Bug 7399: Validate Form based & Raw command based templates", function () {
      let id;
      dataSources.createQueryWithDatasourceSchemaTemplate(
        datasourceName,
        "listingAndReviews",
        "Find",
      );
      EditorNavigation.SelectEntityByName("Query1", EntityType.Query);

      cy.get(`${formControls.mongoCollection} .rc-select-selection-item`)
        .then(($field) => {
          return cy.wrap($field).invoke("text");
        })
        .then((val) => {
          cy.wrap(val).as("colData");
        });
      cy.EvaluatFieldValue(formControls.mongoFindQuery).then((queryData) => {
        let localqueryData = queryData.replace("{", "").replace("}", "");
        id = localqueryData;
        cy.log("Query value is : " + localqueryData);
        cy.wrap(localqueryData).as("queryData");
      });
      cy.EvaluatFieldValue(formControls.mongoFindSort).then((sortData) => {
        let localsortData = sortData.replace("{", "").replace("}", "");
        cy.log("Sort value is : " + localsortData);
        cy.wrap(localsortData).as("sortData");
      });
      cy.EvaluatFieldValue(formControls.mongoFindLimit).then((limitData) => {
        let locallimitData = limitData.replace("{", "").replace("}", "");
        cy.log("Limit value is : " + locallimitData);
        cy.wrap(locallimitData).as("limitData");
      });

      cy.onlyQueryRun();
      cy.wait(1000);
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(true);
        expect(response.body.data.body[0]._id).to.eq(
          id.split(":")[1].trim().replace(/['"]+/g, ""),
        );
      });

      cy.ValidateAndSelectDropdownOption(
        formControls.commandDropdown,
        "Find document(s)",
        "Raw",
      );

      cy.EvaluatFieldValue().then((rawData) => {
        rawData = rawData.replace("{", "").replace("}", "");
        cy.log("rawData value is : " + rawData);
        cy.wrap(rawData).as("rawData");
      });

      cy.all(
        cy.get("@colData"),
        cy.get("@queryData"),
        cy.get("@sortData"),
        cy.get("@limitData"),
        cy.get("@rawData"),
      ).then((values) => {
        expect(values[4].trim()).to.contain(values[0].trim());
        expect(values[4].trim()).to.contain(values[1].trim());
        expect(values[4].trim()).to.contain(values[2].trim());
        expect(values[4].trim()).to.contain(values[3].trim());
      });

      cy.onlyQueryRun();
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(true);
        expect(response.body.data.body[0]._id).to.eq(
          id.split(":")[1].trim().replace(/['"]+/g, ""),
        );
      });
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Query1",
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("9. Delete the datasource after NewPage deletion is success", () => {
      dataSources.DeleteDatasourceFromWithinDS(datasourceName, [200, 409]);
    });

    it("10. Bug 6375: Cyclic Dependency error occurs and the app crashes when the user generate table and chart from mongo query", function () {
      homePage.NavigateToHome();
      homePage.CreateNewApplication();
      dataSources.CreateDataSource("Mongo");
      cy.generateUUID().then((uid) => {
        datasourceName = `Mongo Documents ${uid}`;
        cy.renameDatasource(datasourceName);
        cy.wrap(datasourceName).as("dSName");
      });

      //Insert documents
      cy.get("@dSName").then((dbName) => {
        dataSources.CreateQueryForDS(dbName);
      });

      assertHelper.AssertNetworkStatus("@trigger");

      dataSources.SetQueryTimeout(30000);
      cy.ValidateAndSelectDropdownOption(
        formControls.commandDropdown,
        "Find document(s)",
        "Insert document(s)",
      );

      let nonAsciiDoc = `[{"_id":1, "Från" :"Alen" , "Frõ" :"Active",   "Leverantör":"De Bolster", "Frö":"Basilika - Thai 'Siam QuentityExplorern'"},
    {"_id":2, "Från" :"Joann" , "Frõ" :"Active",   "Leverantör":"De Bolster",   "Frö":"Sallad - Oakleaf 'Salad Bowl'"},
    {"_id":3, "Från" :"Olivia" , "Frõ" :"Active",   "Leverantör":"De Bolster", "Frö":"Sallad - Oakleaf 'Red Salad Bowl'"}]`;

      dataSources.EnterJSContext({
        fieldLabel: "Collection",
        fieldValue: "NonAsciiTest",
      });

      agHelper.EnterValue(nonAsciiDoc, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Documents",
      });

      cy.getEntityName().then((entity) => {
        cy.wrap(entity).as("entity");
      });
      dataSources.RunQuery();

      //Find the Inserted Document
      cy.ValidateAndSelectDropdownOption(
        formControls.commandDropdown,
        "Insert document(s)",
        "Find document(s)",
      );

      dataSources.RunQuery();
      dataSources.CheckResponseRecordsCount(3);

      dataSources.AssertTableInVirtuosoList(datasourceName, "NonAsciiTest");

      //Verifying Suggested Widgets functionality
      apiPage.SelectPaneTab("Response");
      dataSources.AddSuggestedWidget(Widgets.Table);
      cy.wait("@updateLayout").then(({ response }) => {
        cy.log("1st Response is :" + JSON.stringify(response.body));
        //expect(response.body.data.dsl.children[0].type).to.eq("TABLE_WIDGET");
      });

      cy.get("@entity").then((entityN) =>
        EditorNavigation.SelectEntityByName(entityN, EntityType.Query),
      );
      dataSources.AddSuggestedWidget(Widgets.Chart);
      cy.wait("@updateLayout").then(({ response }) => {
        cy.log("2nd Response is :" + JSON.stringify(response.body));
        //expect(response.body.data.dsl.children[1].type).to.eq("CHART_WIDGET");
      });

      cy.VerifyErrorMsgAbsence("Cyclic dependency found while evaluating");
      cy.get("@entity").then((entityN) =>
        EditorNavigation.SelectEntityByName(entityN, EntityType.Query),
      );

      //Update document - Single document
      cy.wait(2000);
      cy.get("body").click(0, 0, { force: true });
      cy.ValidateAndSelectDropdownOption(
        formControls.commandDropdown,
        "Find document(s)",
        "Update document(s)",
      );

      agHelper.EnterValue("{_id: {$eq:1}}", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Query",
      });

      agHelper.EnterValue("{$set:{ 'Frõ': 'InActive'}}", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Update",
      });

      //cy.typeValueNValidate("{_id: {$eq:1}}", formControls.mongoUpdateManyQuery);
      // cy.typeValueNValidate(
      //   "{$set:{ 'Frõ': 'InActive'}}",
      //   formControls.mongoUpdateManyUpdate,
      // );
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.body.nModified).to.eq(1);
      });

      // //Update document - All matching documents
      // cy.validateNSelectDropdown("Command", "Find document(s)", "Update document(s)");
      // cy.typeValueNValidate("{_id: {$gte:2}}", "Query");
      // cy.typeValueNValidate("{$set:{ 'Frõ': 'InActive'}}", "Update");
      // cy.validateNSelectDropdown("Limit", "Single document", "All matching documents");
      // cy.runQuery()
      // cy.wait("@postExecute").then(({ response }) => {
      //   expect(response.body.data.body.nModified).to.eq(2);
      // });

      // //Verify Updation Successful:
      // cy.validateNSelectDropdown("Command", "Update document(s)", "Find document(s)");
      // cy.runQuery()
      // cy.wait("@postExecute").then(({ response }) => {
      //   expect(response.body.data.body[0].Frõ).to.eq('InActive');
      // });

      //Delete documents using both Single & Multiple Documents
      cy.ValidateAndSelectDropdownOption(
        formControls.commandDropdown,
        "Update document(s)",
        "Delete document(s)",
      );

      agHelper.EnterValue("{_id : {$eq: 1 }}", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Query",
      });
      cy.ValidateAndSelectDropdownOption(
        formControls.mongoDeleteLimitDropdown,
        "Single document",
      );
      dataSources.RunQuery({ toValidateResponse: false });

      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.body.n).to.eq(1);
      });

      // cy.typeValueNValidate(
      //   "{_id : {$lte: 3 }}",
      //   formControls.mongoDeleteDocumentsQuery,
      // );
      agHelper.EnterValue("{_id : {$lte: 3 }}", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Query",
      });
      cy.ValidateAndSelectDropdownOption(
        formControls.mongoDeleteLimitDropdown,
        "Single document",
        "All matching documents",
      );
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.body.n).to.eq(2);
      });

      //Verify Deletion is Successful:
      cy.ValidateAndSelectDropdownOption(
        formControls.commandDropdown,
        "Delete document(s)",
        "Find document(s)",
      );
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.body.length).to.eq(0); //checking that body is empty array
      });

      //Delete Collection:
      cy.ValidateAndSelectDropdownOption(
        formControls.commandDropdown,
        "Find document(s)",
        "Raw",
      );
      cy.typeValueNValidate('{"drop": "NonAsciiTest"}', formControls.rawBody);
      cy.wait(1000); //Waiting a bit before runing the command
      dataSources.RunQuery({ waitTimeInterval: 2000 });
      dataSources.AssertTableInVirtuosoList(
        datasourceName,
        "NonAsciiTest",
        false,
      );
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });
  },
);
