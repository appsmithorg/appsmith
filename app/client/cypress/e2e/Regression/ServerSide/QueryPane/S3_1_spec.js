/// <reference types="Cypress" />

import BottomTabs from "../../../../support/Pages/IDE/BottomTabs";

const formControls = require("../../../../locators/FormControl.json");
import {
  agHelper,
  entityExplorer,
  dataSources,
  entityItems,
  draggableWidgets,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

let datasourceName;

describe(
  "Validate CRUD queries for Amazon S3 along with UI flow verifications",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    let fileName;

    before(() => {
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        fileName = "S3File_" + uid;
      });
    });

    beforeEach(() => {
      dataSources.StartDataSourceRoutes();
    });

    before("Creates a new Amazon S3 datasource", function () {
      dataSources.CreateDataSource("S3");
      cy.get("@dsName").then((dsName) => {
        datasourceName = dsName;
      });
    });

    it("1. Validate List Files in bucket (all existing files) command, run + Widget Binding", () => {
      const expectedErrorMessages = [
        "NoSuchBucket: The specified bucket does not exist",
        "InvalidBucketName: The specified bucket is not valid",
      ];

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2);
      propPane.UpdatePropertyFieldValue("Default value", "AutoTest");
      dataSources.CreateQueryForDS(datasourceName);
      dataSources.ValidateNSelectDropdown("Command", "List files in bucket");
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").should(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(false);
        expect(response.body.data.body).to.contains(
          "Mandatory parameter 'Bucket name' is missing.",
        );
      });
      agHelper.UpdateCodeInput(formControls.s3BucketName, "{{Input1.text}}"); //Widget Binding

      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait(3000); //for new postExecute to come thru
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(false);
        expect(response.body.data.body).to.satisfy((body) => {
          return expectedErrorMessages.some((errorMessage) =>
            body.includes(errorMessage),
          );
        });
      });
      cy.wait(2000);

      dataSources.createQueryWithDatasourceSchemaTemplate(
        datasourceName,
        "assets-test--appsmith",
        "List files",
      );

      dataSources.runQueryAndVerifyResponseViews({
        count: 100,
        operator: "gte",
      });

      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("2. Validate Create file in bucket command for new file, Verify possible error msgs, run & delete the query", () => {
      //Create File
      dataSources.CreateQueryForDS(datasourceName);
      cy.setQueryTimeout(30000);
      dataSources.ValidateNSelectDropdown(
        "Command",
        "List files in bucket",
        "Create a new file",
      );

      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").should(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(false);
        expect(response.body.data.body).to.contains(
          "Mandatory parameter 'Bucket name' is missing.",
        );
      });
      cy.typeValueNValidate("AutoTest", formControls.s3BucketName);

      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(false);
        expect(response.body.data.body).to.contains(
          "Required parameter 'File path' is missing.",
        );
      });
      cy.typeValueNValidate(fileName, formControls.s3FilePath);

      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(false);
        expect(
          response.body.data.pluginErrorDetails.appsmithErrorMessage,
        ).to.eq(
          "Unable to parse content. Expected to receive an object with `data` and `type`.",
        );
      });

      cy.typeValueNValidate("Hi", formControls.rawBody);
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(false);
        expect(
          response.body.data.pluginErrorDetails.appsmithErrorMessage,
        ).to.eq(
          "Unable to parse content. Expected to receive an object with `data` and `type`.",
        );
      });

      cy.typeValueNValidate(
        '{"data": "Hi, this is Automation script adding File!"}',
        formControls.rawBody,
      );
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(false);
        expect(
          response.body.data.pluginErrorDetails.appsmithErrorMessage,
        ).to.contains("File content is not base64 encoded.");
      });
      dataSources.ValidateNSelectDropdown(
        "File data type",
        "Base64",
        "Text / Binary",
      );

      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(false);
        //expect(['The specified bucket does not exist', 'The specified bucket is not valid.']).to.include(response.body.data.body)
        expect(
          response.body.data.pluginErrorDetails.downstreamErrorMessage,
        ).to.contains("NoSuchBucket: The specified bucket does not exist");
      });

      cy.typeValueNValidate(
        "assets-test.appsmith.com",
        formControls.s3BucketName,
      );

      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(true);
        expect(response.body.data.body.urlExpiryDate).to.exist;
        expect(response.body.data.body.signedUrl).to.exist;
      });
    });

    it("3. Validate List Files in bucket command for new file, Verify possible error msgs, run & delete the query", () => {
      dataSources.ValidateNSelectDropdown(
        "Command",
        "Create a new file",
        "List files in bucket",
      );

      // dataSources.RunQuery({toValidateResponse: false});
      // cy.wait("@postExecute").should(({ response }) => {
      //   expect(response.body.data.isExecutionSuccess).to.eq(false);
      //   expect(response.body.data.body).to.contains(
      //     "Mandatory parameter 'Bucket name' is missing.",
      //   );
      // });
      // cy.typeValueNValidate("assets-test.appsmith.com", "Bucket name");

      cy.typeValueNValidate(fileName, formControls.s3ListPrefix);
      dataSources.RunQuery({ toValidateResponse: false });

      BottomTabs.response.selectResponseResponseTypeFromMenu("JSON");

      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(true);
        expect(response.body.data.body[0].fileName).to.contains("S3File_");
        expect(response.body.data.body[0].url).to.exist;
      });

      cy.typeValueNValidate(fileName, formControls.s3ListPrefix);
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(true);
        expect(response.body.data.body[0].fileName).to.contains("S3File_");
        expect(response.body.data.body[0].url).to.exist;
        expect(response.body.data.body[0].signedUrl).not.to.exist;
      });

      dataSources.ValidateNSelectDropdown("Generate signed URL", "No", "Yes");

      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(true);
        expect(response.body.data.body[0].fileName).to.contains("S3File_");
        expect(response.body.data.body[0].signedUrl).to.exist;
        expect(response.body.data.body[0].url).to.exist;
      });

      //agHelper.GetNClick(debuggerHelper.locators._closeButton);

      // cy.get(formControls.s3ListUnSignedUrl)
      // .scrollIntoView()
      // .should("be.visible")
      // .click({ multiple: true });

      // cy.get(formControls.dropdownWrapper)
      // .should("be.visible")
      // .eq(1)
      // .click({ force: true });

      dataSources.ValidateNSelectDropdown("Generate unsigned URL", "Yes", "No");
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(true);
        expect(response.body.data.body[0].fileName).to.contains("S3File_");
        expect(response.body.data.body[0].signedUrl).to.exist;
        expect(response.body.data.body[0].url).to.not.exist;
      });
      //cy.deleteQueryUsingContext(); //exeute actions & 200 response is verified in this method
    });

    it("4. Validate Read files in bucket command for new file, Verify possible error msgs, run & delete the query", () => {
      //Read File

      //cy.setQueryTimeout(30000);
      dataSources.ValidateNSelectDropdown(
        "Command",
        "List files in bucket",
        "Read file",
      );

      //  dataSources.RunQuery({toValidateResponse: false});
      // cy.wait("@postExecute").should(({ response }) => {
      //   expect(response.body.data.isExecutionSuccess).to.eq(false);
      //   expect(response.body.data.body).to.contains(
      //     "Mandatory parameter 'Bucket name' is missing.",
      //   );
      // });
      // cy.typeValueNValidate("AutoTest", "Bucket name");

      // dataSources.RunQuery({toValidateResponse: false});
      // cy.wait("@postExecute").then(({ response }) => {
      //   expect(response.body.data.isExecutionSuccess).to.eq(false);
      //   expect(response.body.data.body).to.contains(
      //     "Required parameter 'File path' is missing.",
      //   );
      // });
      cy.typeValueNValidate("S3File_", formControls.s3FilePath);

      //  dataSources.RunQuery({toValidateResponse: false});
      // cy.wait("@postExecute").then(({ response }) => {
      //   expect(response.body.data.isExecutionSuccess).to.eq(false);
      //   expect(response.body.data.body.split("(")[0].trim()).to.be.oneOf([
      //     "The specified bucket does not exist",
      //     "The specified bucket is not valid.",
      //   ]);
      // });

      // cy.typeValueNValidate("assets-test.appsmith.com", "Bucket name");

      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(false);
        expect(
          response.body.data.pluginErrorDetails.appsmithErrorMessage,
        ).to.contain(
          "Your S3 query failed to execute. To know more please check the error details.",
        );
      });

      cy.typeValueNValidate(fileName.toLowerCase(), formControls.s3FilePath);

      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(false);
        expect(
          response.body.data.pluginErrorDetails.appsmithErrorMessage,
        ).to.contain(
          "Your S3 query failed to execute. To know more please check the error details.",
        );
      });

      cy.typeValueNValidate(fileName, formControls.s3FilePath);

      //Commenting below since below dropdown is removed from Read
      //cy.validateNSelectDropdown("File data type", "Base64", "Text");

      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(true);
        expect(response.body.data.body.fileData).to.not.eq(
          "Hi, this is Automation script adding File!",
        );
      });

      dataSources.ValidateNSelectDropdown(
        "Base64 encode file - yes/no",
        "Yes",
        "No",
      );
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(true);
        expect(response.body.data.body.fileData).to.eq(
          "Hi, this is Automation script adding File!",
        );
      });
      cy.deleteQueryUsingContext(); //exeute actions & 200 response is verified in this method
    });

    it("5. Validate Delete file command for new file & Validating List Files in bucket command after new file is deleted, Verify possible error msgs, run & delete the query", () => {
      dataSources.CreateQueryForDS(datasourceName);
      cy.setQueryTimeout(30000);
      dataSources.ValidateNSelectDropdown(
        "Command",
        "List files in bucket",
        "Delete file",
      );

      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").should(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(false);
        expect(response.body.data.body).to.contains(
          "Mandatory parameter 'Bucket name' is missing.",
        );
      });
      cy.typeValueNValidate("AutoTest", formControls.s3BucketName);

      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(false);
        expect(response.body.data.body).to.contains(
          "Required parameter 'File path' is missing.",
        );
      });
      cy.typeValueNValidate("S3File_", formControls.s3FilePath);
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(false);
        expect(
          response.body.data.pluginErrorDetails.downstreamErrorMessage,
        ).to.contains("NoSuchBucket: The specified bucket does not exist");
      });
      cy.typeValueNValidate(
        "assets-test.appsmith.com",
        formControls.s3BucketName,
      );
      cy.typeValueNValidate(fileName, formControls.s3FilePath);
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(true);
        expect(response.body.data.body.status).to.eq(
          "File deleted successfully",
        );
      });

      //cy.deleteQueryUsingContext(); //exeute actions & 200 response is verified in this method

      //Validating List Files in bucket command after new file is deleted
      dataSources.ValidateNSelectDropdown(
        "Command",
        "Delete file",
        "List files in bucket",
      );
      //cy.typeValueNValidate("assets-test.appsmith.com", "Bucket name");
      cy.typeValueNValidate(fileName, formControls.s3ListPrefix);
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.isExecutionSuccess).to.eq(true);
        expect(response.body.data.body.length).to.eq(0); //checking that body is empty array
      });
      cy.deleteQueryUsingContext(); //exeute actions & 200 response is verified in this method
    });

    after("Deletes the datasource", () => {
      dataSources.DeleteDatasourceFromWithinDS(datasourceName, [200, 409]);
    });
  },
);
