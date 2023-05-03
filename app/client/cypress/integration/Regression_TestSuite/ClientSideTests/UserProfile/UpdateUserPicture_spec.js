import homePage from "../../../../locators/HomePage";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Update a user's display picture", function () {
  beforeEach(() => {
    _.homePage.GotoEditProfile();

    _.agHelper.GetText(".ads-dialog-trigger .label").then((text) => {
      if (text === "Remove") {
        _.agHelper.GetNClick(".ads-dialog-trigger .label");
      }
    });

    cy.intercept("GET", "/api/v1/users/photo", {
      body: { responseMeta: { status: 200, success: true }, data: {} },
    }).as("savePhoto");
  });

  it("1. Update a user's picture with valid file", function () {
    _.agHelper.GetNClick(".ads-dialog-trigger");
    cy.get(".uppy-Dashboard-input").as("fileInput");

    cy.fixture("Files/valid-image.jpeg").then((fileContent) => {
      cy.get("@fileInput").attachFile({
        fileContent: fileContent.toString(),
        fileName: "valid-image.jpeg",
        mimeType: "image/jpeg",
        encoding: "base64",
      });

      _.agHelper.GetNClick(".uppy-ImageCropper-controls .uppy-c-btn");
      _.agHelper.GetNClick(".uppy-StatusBar-actionBtn--upload");
      // API is finished even before wait begins
      // cy.wait("@savePhoto");
      _.agHelper.AssertElementExist(".image-view img");
    });
  });

  it("2. Invalid file throws error", function () {
    _.agHelper.GetNClick(".ads-dialog-trigger");
    cy.get(".uppy-Dashboard-input").as("fileInput");

    cy.fixture("Files/invalid-image.png").then((fileContent) => {
      cy.get("@fileInput").attachFile({
        fileContent: fileContent.toString(),
        fileName: "invalid-image.png",
        mimeType: "image/png",
        encoding: "base64",
      });

      _.agHelper.ValidateToastMessage(
        "File content doesn't seem to be an image. Please verify.",
      );
    });
  });
});
