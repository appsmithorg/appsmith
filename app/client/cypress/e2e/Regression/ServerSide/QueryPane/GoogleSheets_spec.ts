import {
  dataSources,
  deployMode,
  locators,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";
import datasource from "../../../../locators/DatasourcesEditor.json";

describe(
  "excludeForAirgap",
  "Google Sheets datasource row objects placeholder",
  function () {
    let pluginName = "Google Sheets";
    let placeholderText =
      '{\n  "name": {{nameInput.text}},\n  "dob": {{dobPicker.formattedDate}},\n  "gender": {{genderSelect.selectedOptionValue}} \n}';

    //Skiiping due to open bug #18035: Should the Save button be renamed as "Save and Authorise" in case of Google sheets for datasource discard popup?
    it.skip("1. Bug: 16391 - Google Sheets DS, placeholder objects keys should have quotes", function () {
      // create new Google Sheets datasource
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn(pluginName);

      // navigate to create query tab and create a new query
      // cy.get("@saveDatasource").then((httpResponse) => {
      //   datasourceName = httpResponse.body.data.name;
      //   // clicking on new query to write a query
      //   cy.NavigateToQueryEditor();
      //   cy.get(explorer.createNew).click();
      //   cy.get("div:contains('" + datasourceName + " Query')")
      //     .last()
      //     .click();

      // fill the create new api google sheets form
      // and check for rowobject placeholder text
      cy.get(datasource.gSheetsOperationDropdown).click();
      cy.get(datasource.gSheetsInsertOneOption).click();

      cy.get(datasource.gSheetsEntityDropdown).click();
      cy.get(datasource.gSheetsSheetRowsOption).click();

      cy.get(datasource.gSheetsCodeMirrorPlaceholder).should(
        "have.text",
        placeholderText,
      );

      // delete query and datasource after test is done
      // cy.get("@createNewApi").then((httpResponse) => {
      //   queryName = httpResponse.response.body.data.name;
      //   cy.deleteQueryUsingContext();
      //   cy.deleteDatasource(datasourceName);
      // });
      //});
    });

    it("1. Verify GSheets dropdown options", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Google Sheets");
      VerifyFunctionDropdown([
        "Read / Write / Delete | Selected google sheets",
        "Read / Write / Delete | All google sheets",
        "Read / Write | All google sheets",
        "Read | All google sheets",
      ]);
      dataSources.SaveDSFromDialog(false);
    });

    function VerifyFunctionDropdown(scopeOptions: string[]) {
      agHelper.GetNClick(dataSources._gsScopeDropdown);
      cy.get(dataSources._gsScopeOptions).then(function ($ele) {
        expect($ele.eq(0).text()).to.be.oneOf(scopeOptions);
        expect($ele.eq(1).text()).to.be.oneOf(scopeOptions);
        expect($ele.eq(2).text()).to.be.oneOf(scopeOptions);
      });
      agHelper.GetNClick(dataSources._gsScopeDropdown);
    }

    it("2. Bug # 25004 - Verify Google Sheets documentation opens", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn(pluginName);
      deployMode.StubWindowNAssert(
        locators._learnMore,
        "querying-google-sheets#create-queries",
        "getWorkspace",
      );
      agHelper.GetNClick(locators._visibleTextSpan("Don't save"));
      agHelper.Sleep();
      agHelper.GoBack();
      agHelper.Sleep();
    });
  },
);
