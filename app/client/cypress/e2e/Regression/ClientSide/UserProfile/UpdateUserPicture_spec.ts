import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Update a user's display picture",
  { tags: ["@tag.Settings"] },
  function () {
    beforeEach(() => {
      _.homePage.GotoEditProfile();

      _.agHelper.GetText(_.locators._ds_imageSelector_label).then((text) => {
        text === "Remove" &&
          _.agHelper.GetNClick(_.locators._ds_imageSelector_label);
      });

      // API is finished even before wait begins
      // cy.intercept("GET", "/api/v1/users/photo", {
      //   body: { responseMeta: { status: 200, success: true }, data: {} },
      // }).as("savePhoto");
    });

    it("1. Update a user's picture with valid file", function () {
      _.agHelper.GetNClick(_.locators._ds_imageSelector);
      _.agHelper.GetElement(_.locators._ds_uppy_fileInput).as("fileInput");
      _.agHelper.GetElement("@fileInput").eq(0).selectFile(
        {
          contents: "cypress/fixtures/Files/valid-image.jpeg",
          fileName: "valid-image.jpeg",
          mimeType: "image/jpeg",
        },
        { force: true },
      );

      _.agHelper.GetNClick(_.locators._ds_uppy_crop_confirm);
      _.agHelper.GetNClick(_.locators._ds_uppy_upload_btn);
      // API is finished even before wait begins
      // cy.wait("@savePhoto");
      _.agHelper.AssertElementExist(".image-view img");
    });

    it("2. Invalid file throws error", function () {
      _.agHelper.GetNClick(_.locators._ds_imageSelector);
      _.agHelper.GetElement(_.locators._ds_uppy_fileInput).as("fileInput");

      _.agHelper.GetElement("@fileInput").eq(0).selectFile(
        {
          contents: "cypress/fixtures/Files/invalid-image.png",
          fileName: "invalid-image.png",
          mimeType: "image/png",
        },
        { force: true },
      );

      _.agHelper.ValidateToastMessage(
        "File content doesn't seem to be an image. Please verify.",
      );
    });
  },
);
