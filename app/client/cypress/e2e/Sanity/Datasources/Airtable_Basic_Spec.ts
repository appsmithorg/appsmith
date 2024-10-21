import {
  agHelper,
  entityExplorer,
  entityItems,
  dataSources,
  dataManager,
  draggableWidgets,
  propPane,
  deployMode,
  locators,
  table,
} from "../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../support/Pages/EditorNavigation";

let dsName: any, jsonSpecies: any, offset: any, insertedRecordId: any;
describe(
  "Validate Airtable Ds",
  {
    tags: [
      "@tag.Datasource",
      "@tag.Sanity",
      "@tag.excludeForAirgap",
      "@tag.Git",
      "@tag.AccessControl",
    ],
  },
  () => {
    before("Create a new Airtable DS", () => {
      dataSources.CreateDataSource("Airtable", true, false);
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
      dataSources.AssertDataSourceInfo([
        "Authentication type",
        "Personal access token",
      ]);
    });

    it("1. Validate List Records", () => {
      let specieslist = new Array();
      dataSources.CreateQueryAfterDSSaved();

      //List all records
      dataSources.ValidateNSelectDropdown(
        "Command",
        "Please select an option",
        "List records",
      );

      agHelper.EnterValue(
        dataManager.dsValues[dataManager.defaultEnviorment].AirtableBase,
        {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Base ID ",
        },
      );
      agHelper.EnterValue(
        dataManager.dsValues[dataManager.defaultEnviorment].AirtableTable,
        {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Table name",
        },
      );

      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        jsonSpecies = resObj.response.body.data.body;
        jsonSpecies.records.forEach((record: { fields: any }) => {
          specieslist.push(record.fields.Species_ID);
        });
        expect(specieslist.length).to.be.at.least(53); //making sure all fields are returned
      });

      //Filter Species_ID & Species fields only
      agHelper.EnterValue(
        "fields%5B%5D=Species_ID&fields%5B%5D=Species&fields%5B%5D=Taxa",
        {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Fields",
        },
      );

      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        jsonSpecies = resObj.response.body.data.body;
        const hasOnlyAllowedKeys = jsonSpecies.records.every((record: any) => {
          const fieldKeys = Object.keys(record.fields);
          return (
            fieldKeys.includes("Species_ID") &&
            fieldKeys.includes("Species") &&
            fieldKeys.includes("Taxa") &&
            fieldKeys.length === 3
          );
        });
        expect(hasOnlyAllowedKeys).to.be.true; //making sure all records have only Filters fields returned in results
      });

      //Validate Max records
      agHelper.EnterValue("11", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Max records",
      });
      agHelper.EnterValue("", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Page size",
      });
      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        jsonSpecies = resObj.response.body.data.body;
        expect(jsonSpecies.records.length).to.eq(11); //making sure only 11 record fields are returned
      });

      //Validate Page Size
      agHelper.EnterValue("6", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Page size",
      });
      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        jsonSpecies = resObj.response.body.data.body;
        expect(jsonSpecies.records.length).to.eq(6); //making sure only 6 record fields are returned, honouring the PageSize

        //Validating offset
        offset = jsonSpecies.offset;
        agHelper.EnterValue(offset, {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Offset",
        });
        dataSources.RunQuery();

        cy.get("@postExecute").then((resObj: any) => {
          jsonSpecies = resObj.response.body.data.body;
          expect(jsonSpecies.records.length).to.eq(5); //making sure only remaining records are returned
        });
      });

      //Validate Filter by Formula
      //let asc_specieslist = new Array(); //emptying array, specieslist.length = 0 did not work!
      agHelper.EnterValue("", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Offset",
      }); //Removing Offset
      agHelper.EnterValue('NOT({Taxa} = "Rodent")', {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Filter by formula",
      });
      dataSources.RunQuery();

      cy.get("@postExecute").then((resObj: any) => {
        jsonSpecies = resObj.response.body.data.body;
        const allRecordsWithRodentTaxa = jsonSpecies.records.filter(
          (record: { fields: { Taxa: string } }) =>
            record.fields.Taxa === "Rodent",
        );
        expect(allRecordsWithRodentTaxa.length).to.eq(0);
      });

      //Validate Sort - asc
      let asc_specieslist = new Array(); //emptying array, specieslist.length = 0 did not work!
      agHelper.EnterValue("", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Page size",
      }); //Removing Page Size
      agHelper.EnterValue("", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Filter by formula",
      }); //Removing Filter by Formula
      agHelper.EnterValue("10", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Max records",
      });
      agHelper.EnterValue("sort%5B0%5D%5Bfield%5D=Species_ID", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Sort",
      }); //Sort by default ascending, descneding is thrown error, checking with Felix

      dataSources.RunQuery();

      cy.get("@postExecute").then((resObj: any) => {
        jsonSpecies = resObj.response.body.data.body;
        const sorted = jsonSpecies.records.every(
          (record: { fields: { Species_ID: string } }, i: number) => {
            if (i === 0) {
              asc_specieslist.push(record.fields.Species_ID);
              return true;
            }
            if (
              record.fields.Species_ID >=
              jsonSpecies.records[i - 1].fields.Species_ID
            ) {
              asc_specieslist.push(record.fields.Species_ID);
              return true;
            }
            return false;
          },
        );
        cy.log("Sorted specieslist is :" + asc_specieslist);
        expect(sorted).to.be.true; //making records returned are Sorted by Species_ID - in ascending
      });

      //Validate Sort - desc
      let desc_specieslist = new Array(); //emptying array, specieslist.length = 0 did not work!
      agHelper.EnterValue(
        "sort%5B0%5D%5Bfield%5D=Species_ID&sort%5B0%5D%5Bdirection%5D=desc",
        {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Sort",
        },
      ); //Sort by descending

      dataSources.RunQuery();

      cy.get("@postExecute").then((resObj: any) => {
        jsonSpecies = resObj.response.body.data.body;
        const sorted = jsonSpecies.records.every(
          (record: { fields: { Species_ID: string } }, i: number) => {
            if (i === 0) {
              desc_specieslist.push(record.fields.Species_ID);
              return true;
            }
            if (
              record.fields.Species_ID <=
              jsonSpecies.records[i - 1].fields.Species_ID
            ) {
              desc_specieslist.push(record.fields.Species_ID);
              return true;
            }
            return false;
          },
        );
        cy.log("Desc Sorted specieslist is :" + desc_specieslist);
        expect(sorted).to.be.true; //making records returned are Sorted by Species_ID - in descending
      });

      //Validate View - desc
      let view_specieslist = new Array();
      const isValidSpeciesID = (id: string) => ["EO", "PE"].includes(id);
      agHelper.EnterValue("", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Sort",
      }); //Removing Sort

      agHelper.EnterValue("GridView_CI", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "View",
      });

      dataSources.RunQuery({ toValidateResponse: false }); //For CI failure!
      agHelper.Sleep(3000);
      dataSources.RunQuery();

      cy.get("@postExecute").then((resObj: any) => {
        jsonSpecies = resObj.response.body.data.body;
        const isJSONValid = jsonSpecies.records.every(
          (record: { fields: { Species_ID: any } }) => {
            const speciesID = record.fields.Species_ID;
            view_specieslist.push(record.fields.Species_ID);
            return isValidSpeciesID(speciesID);
          },
        );
        cy.log("View specieslist is :" + view_specieslist);
        expect(isJSONValid).to.be.true; //Verify if records Species_ID is part of View data
      });
    });

    it("2. Drag Drop table & verify api data to widget binding", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE);
      propPane.EnterJSContext("Table data", "{{Api1.data.records}}");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitUntilTableLoad(0, 0, "v2");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Api1", EntityType.Api);
    });

    it("3. Create/Retrieve/Update/Delete records", () => {
      let createReq = `[{"fields": {
      "Species_ID": "SF",
      "Genus": "Sigmodon",
      "Species": "fulviventer",
      "Taxa": "Rodent"
    }}]`;

      //Create
      dataSources.ValidateNSelectDropdown(
        "Command",
        "List records",
        "Create records",
      );
      agHelper.EnterValue(createReq, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Records",
      });
      agHelper.Sleep(500); // for the Records field to settle

      dataSources.RunQuery();

      cy.get("@postExecute").then((resObj: any) => {
        jsonSpecies = resObj.response.body.data.body;
        //cy.log("jsonSpecies is"+ jsonSpecies)
        expect(jsonSpecies.records.length).to.eq(1); //making sure only inserted record is returned

        //Retrieve a record
        insertedRecordId = jsonSpecies.records[0].id;
        dataSources.ValidateNSelectDropdown(
          "Command",
          "Create records",
          "Retrieve a record",
        );
        agHelper.EnterValue(insertedRecordId, {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Record ID ",
        });

        dataSources.RunQuery();

        cy.get("@postExecute").then((resObj: any) => {
          jsonSpecies = resObj.response.body.data.body;
          const hasOnlyInsertedRecord = () => {
            return (
              jsonSpecies.fields.Species_ID === "SF" &&
              jsonSpecies.fields.Genus === "Sigmodon" &&
              jsonSpecies.fields.Species === "fulviventer" &&
              jsonSpecies.fields.Taxa === "Rodent"
            );
          };
          expect(hasOnlyInsertedRecord()).to.be.true;
        });

        //Update Records
        dataSources.ValidateNSelectDropdown(
          "Command",
          "Retrieve a record",
          "Update records",
        );
        agHelper.EnterValue(
          `[{ "id" : ${insertedRecordId},
        fields: {
          Species_ID: "SG",
          Genus: "Spizella",
          Species: "clarki",
          Taxa: "Bird",
        }}]`,
          {
            propFieldName: "",
            directInput: false,
            inputFieldName: "Records",
          },
        );

        dataSources.RunQuery();

        cy.get("@postExecute").then((resObj: any) => {
          jsonSpecies = resObj.response.body.data.body;
          const hasOnlyUpdatedRecord = () => {
            return (
              jsonSpecies.records[0].fields.Species_ID === "SG" &&
              jsonSpecies.records[0].fields.Genus === "Spizella" &&
              jsonSpecies.records[0].fields.Species === "clarki" &&
              jsonSpecies.records[0].fields.Taxa === "Bird"
            );
          };
          expect(hasOnlyUpdatedRecord()).to.be.true;
        });

        //Delete A record
        //insertedRecordId = jsonSpecies.id;
        dataSources.ValidateNSelectDropdown(
          "Command",
          "Update records",
          "Delete a record",
        );

        dataSources.RunQuery();

        cy.get("@postExecute").then((resObj: any) => {
          jsonSpecies = resObj.response.body.data.body;
          expect(jsonSpecies.deleted).to.be.true;
        });
      });
    });

    after("Delete the query & datasource", () => {
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      dataSources.DeleteDatasourceFromWithinDS(dsName, 409); //Since page was deployed in testcase #2
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitForTableEmpty("v2");
      deployMode.NavigateBacktoEditor();
      dataSources.DeleteDatasourceFromWithinDS(dsName);
    });
  },
);
