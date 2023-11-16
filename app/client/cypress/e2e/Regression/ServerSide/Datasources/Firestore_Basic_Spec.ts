import {
  agHelper,
  entityExplorer,
  dataSources,
  entityItems,
  deployMode,
  locators,
  draggableWidgets,
  table,
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";

let dsName: any,
  guid: any,
  cities: any,
  newCityPath: any,
  createCity: any,
  cityName = "LA_";
describe("Validate Firestore DS", () => {
  before("Generate GUID for new Firestore DS", () => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      guid = uid;
      dsName = "Firestore" + " " + uid;
    });
  });

  it("1. Firestore placeholder & mandatory mark verification", () => {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Firestore");
    agHelper.AssertElementVisibility(dataSources._imgFireStoreLogo);
    agHelper.GetNAssertContains(locators._dsName, "Untitled datasource");
    agHelper.GetNClick(locators._dsName);
    agHelper.ClearTextField(locators._dsNameTxt); //removing ds name
    agHelper.AssertTooltip("Please enter a valid name");
    //agHelper.ValidateToastMessage("Invalid name");
    agHelper.TypeText(locators._dsNameTxt, dsName);
    agHelper.PressEnter();
    agHelper.AssertAttribute(
      locators._inputFieldByName("Database URL") + "//" + locators._inputField,
      "placeholder",
      "https://your-project-id.firebaseio.com",
    );
    agHelper
      .GetElement(
        locators._inputFieldByName("Project Id") + "//" + locators._inputField,
      )
      .should("not.have.attr", "placeholder");
    dataSources.TestDatasource(false);
    agHelper.ValidateToastMessage("Missing Firestore URL.");
    agHelper.ValidateToastMessage("Missing ProjectID in datasource.");
    agHelper.ValidateToastMessage("Missing ClientJSON in datasource.");
    dataSources.FillFirestoreDSForm();
    dataSources.TestSaveDatasource();
  });

  it("2. Validate List/Create/Update/Get", () => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      cityName += uid;
      createCity =
        `{
      "name": "` +
        cityName +
        `",
      "state": "CA",
      "country": "USA",
      "capital": false,
      "population": 3900000,
      "regions": ["west_coast", "socal"]
    }`;
      dataSources.CreateQueryAfterDSSaved();

      //Create
      dataSources.ValidateNSelectDropdown(
        "Commands",
        "List Documents",
        "Create document",
      );

      agHelper.EnterValue(
        "cities/{{Math.random().toString(36).substring(2, 24)}}",
        {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Collection Name",
        },
      );

      agHelper.EnterValue(createCity, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Body",
      });

      dataSources.RunQuery(); //Create the document

      //Find the document id of the newly inserted record + Verify List all records
      dataSources.ValidateNSelectDropdown(
        "Commands",
        "Create document",
        "List Documents",
      );
      agHelper.EnterValue("cities", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Collection Name",
      });

      agHelper.TypeDynamicInputValueNValidate(
        "name",
        dataSources._nestedWhereClauseKey(0),
      );
      agHelper.TypeDynamicInputValueNValidate(
        cityName,
        dataSources._nestedWhereClauseValue(0),
      );

      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        cities = JSON.parse(JSON.stringify(resObj.response.body.data.body));

        cy.wrap(cities)
          .should("be.an", "array")
          .its(0)
          .should("have.property", "name", cityName); //making sure newly inserted record is returned
        const newCity = cities.find(
          (city: { name: string }) => city.name === cityName,
        );
        newCityPath = newCity._ref.path;

        agHelper.GetNClick(dataSources._whereDelete(0)); //removign where clause, add new condition
        agHelper.TypeDynamicInputValueNValidate(
          "capital",
          dataSources._nestedWhereClauseKey(0),
        );
        agHelper.TypeDynamicInputValueNValidate(
          "true",
          dataSources._nestedWhereClauseValue(0),
        );
        dataSources.RunQuery();
        cy.get("@postExecute").then((resObj: any) => {
          cities = JSON.stringify(resObj.response.body.data.body);
          cy.wrap(cities).should("deep.equal", "[]"); //validating no record is returned
        });

        agHelper.GetNClick(dataSources._whereDelete(0)); //removign where clause

        //Update document
        dataSources.ValidateNSelectDropdown(
          "Commands",
          "List Documents",
          "Update document",
        );

        agHelper.EnterValue(newCityPath, {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Collection Name",
        });

        agHelper.EnterValue(
          `{
        "state": "LL"
        }`,
          {
            propFieldName: "",
            directInput: false,
            inputFieldName: "Body",
          },
        );

        dataSources.RunQuery(); //Update the document

        //Validate the update happened fine
        dataSources.ValidateNSelectDropdown(
          "Commands",
          "Update document",
          "List Documents",
        );
        agHelper.EnterValue("cities", {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Collection Name",
        });
        agHelper.TypeDynamicInputValueNValidate(
          "name",
          dataSources._nestedWhereClauseKey(0),
        );
        agHelper.TypeDynamicInputValueNValidate(
          cityName,
          dataSources._nestedWhereClauseValue(0),
        );
        dataSources.RunQuery();

        cy.get("@postExecute").then((resObj: any) => {
          cities = JSON.parse(JSON.stringify(resObj.response.body.data.body));
          const losAngeles = cities.find(
            (city: { name: string }) => city.name === cityName,
          );
          expect(losAngeles.state).to.eq("LL"); //Verifying update is fine
        });

        //Get Document
        dataSources.ValidateNSelectDropdown(
          "Commands",
          "List Documents",
          "Get Document",
        );

        agHelper.EnterValue(newCityPath, {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Collection/Document path",
        });

        dataSources.RunQuery();
        cy.get("@postExecute").then((resObj: any) => {
          cities = JSON.parse(JSON.stringify(resObj.response.body.data.body));
          cy.wrap(cities).should("have.property", "name", cityName); //making sure inserted record is returned
        });
      });
    });
  });

  it("3. Validate Widget binding & Deploy app", () => {
    dataSources.ValidateNSelectDropdown(
      "Commands",
      "Get Document",
      "List Documents",
    );
    agHelper.EnterValue("cities", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Collection Name",
    });
    agHelper.GetNClick(dataSources._whereDelete(0)); //removign where clause, add new condition
    dataSources.RunQuery();
    dataSources.AddSuggestedWidget(Widgets.Table);
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
    table.WaitUntilTableLoad(0, 0, "v2");
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("Query1", "Queries/JS");
  });

  it("4. Validate Upsert [Update & Insert]/Delete documents", () => {
    //Validating Upsert
    dataSources.ValidateNSelectDropdown(
      "Commands",
      "List Documents",
      "Upsert Document",
    );

    agHelper.EnterValue(newCityPath, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Collection/Document path",
    });

    agHelper.EnterValue(
      `{
        "population": 4000000
       }`,
      {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Body",
      },
    );
    dataSources.RunQuery(); //Upsert the document

    dataSources.ValidateNSelectDropdown(
      "Commands",
      "Upsert Document",
      "List Documents",
    );
    agHelper.EnterValue("cities", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Collection Name",
    });
    // agHelper.EnterValue('["population"]', {
    //   propFieldName: "",
    //   directInput: false,
    //   inputFieldName: "Order By",
    // });

    agHelper.TypeDynamicInputValueNValidate(
      "population",
      dataSources._nestedWhereClauseKey(0),
    );
    agHelper.TypeDynamicInputValueNValidate(
      "4000000",
      dataSources._nestedWhereClauseValue(0),
    );
    dataSources.RunQuery();

    const expectedKeys = ["_ref", "population"];
    cy.get("@postExecute").then((resObj: any) => {
      cities = JSON.parse(JSON.stringify(resObj.response.body.data.body));
      const firstRecordFields = Object.keys(cities[0]);
      cy.log("firstRecordFields is " + firstRecordFields);
      expect(firstRecordFields.every((key) => expectedKeys.includes(key))).to.be
        .true; //Validating Upsert!
    });

    //Validating Delete
    dataSources.ValidateNSelectDropdown(
      "Commands",
      "List Documents",
      "Delete document",
    );

    agHelper.EnterValue(newCityPath, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Collection/Document path",
    });
    dataSources.RunQuery(); //Delete the record

    //Validate Deletion
    dataSources.ValidateNSelectDropdown(
      "Commands",
      "Delete document",
      "List Documents",
    );
    agHelper.EnterValue("cities", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Collection Name",
    });
    agHelper.TypeDynamicInputValueNValidate(
      "name",
      dataSources._nestedWhereClauseKey(0),
    );
    agHelper.TypeDynamicInputValueNValidate(
      cityName,
      dataSources._nestedWhereClauseValue(0),
    );
    dataSources.RunQuery();

    cy.get("@postExecute").then((resObj: any) => {
      cities = JSON.parse(JSON.stringify(resObj.response.body.data.body));
      const hasNoInsertedCity = () => {
        return Array.isArray(cities) && cities.length === 0;
      };
      expect(hasNoInsertedCity()).to.be.true; //Validating Deletion!
    });
  });

  after("Delete the query & datasource", () => {
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      entityType: entityItems.Query,
    });
    dataSources.DeleteDatasourceFromWithinDS(dsName, 409);
    //commenting below since after query delete, we run into risk of not seeing the datasource in EntityExplorer
    // entityExplorer.SelectEntityByName(dsName, "Datasources");
    // entityExplorer.ActionContextMenuByEntityName({
    //   entityNameinLeftSidebar: dsName,
    //   action: "Delete",
    //   entityType: entityItems.Datasource,
    // });
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    dataSources.DeleteDatasourceFromWithinDS(dsName, 200);
  });
});
