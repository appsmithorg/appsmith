import * as _ from "../../../../support/Objects/ObjectsCore";
import AdminsSettings from "../../../../locators/AdminsSettings";

describe("Static URL - Slug Persistence", { tags: ["@tag.Settings"] }, () => {
  it("1. Should auto-generate slug from application name when Static URL toggle is enabled", () => {
    // Navigate to General Settings
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToGeneralSettings();

    // Get the current application name
    _.agHelper.GetText(AdminsSettings.generalSettingsAppName, "val").then((appName) => {
        const appNameStr = appName as string;
        // Convert app name to expected slug format (lowercase, spaces replaced with hyphens)
        const expectedSlug = appNameStr
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""); // Remove any special characters except hyphens

        // Toggle on Static URL
        _.agHelper.GetNClick(AdminsSettings.generalSettingsStaticUrl);

        // Wait for the API call to complete
        _.assertHelper.AssertNetworkStatus("@fetchAppSlugSuggestion", 200);
        cy.get("@fetchAppSlugSuggestion").then((interception: any) => {
          const suggestedSlug = interception.response.body.data;

          // Verify the slug input field is visible and contains the suggested slug
          _.agHelper.AssertElementVisibility(AdminsSettings.generalSettingsStaticAppSlug);
          _.agHelper.AssertText(AdminsSettings.generalSettingsStaticAppSlug, "val", suggestedSlug);

          // Verify the suggested slug starts with the expected slug derived from the application name
          // Backend appends a random hash after a hyphen for uniqueness
          expect(suggestedSlug).to.satisfy((slug: string) => 
            slug.startsWith(`${expectedSlug}`)
          );
        });
      });
  });

  it("2. Should allow editing slug and show available status with updated URL preview", () => {
    // Continue from test 1 - static URL is already enabled and slug is already set
    // Get the current slug from the input field
    _.agHelper.GetText(AdminsSettings.generalSettingsStaticAppSlug, "val").then((initialSlug) => {
        const initialSlugStr = initialSlug as string;

        // Verify the slug input field is visible and contains the suggested slug
        _.agHelper.AssertElementVisibility(AdminsSettings.generalSettingsStaticAppSlug);
        _.agHelper.AssertText(AdminsSettings.generalSettingsStaticAppSlug, "val", initialSlugStr);

        // Modify the slug by appending "1"
        const modifiedSlug = initialSlugStr + "1";
        _.agHelper.ClearNType(AdminsSettings.generalSettingsStaticAppSlug, modifiedSlug);
        
        // Wait for the validation API call to complete
        _.assertHelper.AssertNetworkStatus("@validateAppSlug", 200);

        // Verify the "Available" message appears
        _.agHelper.AssertContains("Available", "be.visible");

        // Verify the URL preview shows the modified slug
        // The URL preview should contain the full URL ending with the modified slug
        _.agHelper.AssertContains(`/app/${modifiedSlug}`, "be.visible");
      });
  });

  it("3. Should persist slug after confirmation and reflect on page reload", () => {
    // Continue from test 2 - slug is already modified and available
    // Get the modified slug from the input field
    _.agHelper.GetText(AdminsSettings.generalSettingsStaticAppSlug, "val").then((modifiedSlug) => {
        const modifiedSlugStr = modifiedSlug as string;

        // Verify the "Available" message is still visible
        _.agHelper.AssertContains("Available", "be.visible");

        // Click on "Apply" button to open confirmation modal
        // The Apply button is in the settings pane, not in the modal
        _.agHelper.AssertElementEnabledDisabled(AdminsSettings.staticUrlConfirmationConfirm, 0, false);
        _.agHelper.GetNClickByContains(AdminsSettings.staticUrlConfirmationConfirm, "Apply");

        // Verify the modal appears with title "Change App Slug"
        _.agHelper.AssertElementVisibility(AdminsSettings.staticUrlConfirmationModal);
        _.agHelper.AssertContains("Change App Slug", "be.visible");

        // Verify the modal shows the "To" URL with the modified slug
        _.agHelper.AssertContains("To", "be.visible");
        _.agHelper.AssertContains(`/app/${modifiedSlugStr}`, "be.visible");

        // Click on "Change App Slug" button in the modal to confirm
        _.agHelper.GetNClickByContains(AdminsSettings.staticUrlConfirmationConfirm, "Change App Slug");

        // Verify the success toast notification appears
        _.agHelper.ValidateToastMessage("App slug updated");

        // Reload the page
        _.agHelper.CypressReload();

        // Verify the slug persists after reload
        _.agHelper.AssertElementVisibility(AdminsSettings.generalSettingsStaticAppSlug);
        _.agHelper.AssertText(AdminsSettings.generalSettingsStaticAppSlug, "val", modifiedSlugStr);
      });
  });

  it("4. Should not persist slug when modal is cancelled", () => {
    // Continue from test 3 - slug is already persisted from previous test
    // Get the current persisted slug from the input field
    _.agHelper.GetText(AdminsSettings.generalSettingsStaticAppSlug, "val").then((persistedSlug) => {
        const persistedSlugStr = persistedSlug as string;

        // Modify the slug by appending "2" to create a new modified slug
        const modifiedSlug = persistedSlugStr + "2";
        _.agHelper.ClearNType(AdminsSettings.generalSettingsStaticAppSlug, modifiedSlug);

        // Wait for the validation API call to complete
        _.assertHelper.AssertNetworkStatus("@validateAppSlug", 200);

        // Verify the "Available" message appears
        _.agHelper.AssertContains("Available", "be.visible");

        // Click on "Apply" button to open confirmation modal
        _.agHelper.AssertElementEnabledDisabled(AdminsSettings.staticUrlConfirmationConfirm, 0, false);
        _.agHelper.GetNClickByContains(AdminsSettings.staticUrlConfirmationConfirm, "Apply");

        // Verify the modal appears with title "Change App Slug"
        _.agHelper.AssertElementVisibility(AdminsSettings.staticUrlConfirmationModal);
        _.agHelper.AssertContains("Change App Slug", "be.visible");

        // Verify the modal shows the "To" URL with the modified slug
        _.agHelper.AssertContains("To", "be.visible");
        _.agHelper.AssertContains(`/app/${modifiedSlug}`, "be.visible");

        // Click on "Cancel" button in the modal instead of confirming
        // This should close the modal without persisting the slug
        _.agHelper.GetNClickByContains(AdminsSettings.staticUrlConfirmationCancel, "Cancel");

        // Verify the modal is closed
        _.agHelper.AssertElementAbsence(AdminsSettings.staticUrlConfirmationModal);

        // Reload the page
        _.agHelper.CypressReload();

        // Wait for the page to load
        _.appSettings.OpenAppSettings();
        _.appSettings.GoToGeneralSettings();

        // Verify the modified slug does NOT persist after reload
        // The slug should revert to the previously persisted slug (from test 3)
        _.agHelper.AssertElementVisibility(AdminsSettings.generalSettingsStaticAppSlug);
        _.agHelper.AssertText(AdminsSettings.generalSettingsStaticAppSlug, "val", persistedSlugStr);
        // Note: AssertText doesn't support "not.have.value", so keeping the original assertion
        cy.get(AdminsSettings.generalSettingsStaticAppSlug).should("not.have.value", modifiedSlug);
      });
  });

  it("5. Should delete persisted slug and generate new slug when Static URL is disabled and re-enabled", () => {
    // Continue from test 4 - slug is already persisted from previous test
    // Get the current persisted slug and application name
    let appNameStr: string;
    let persistedSlugStr: string;

    _.agHelper.GetText(AdminsSettings.generalSettingsAppName, "val").then((appName) => {
      appNameStr = appName as string;
    });

    _.agHelper.GetText(AdminsSettings.generalSettingsStaticAppSlug, "val").then((persistedSlug) => {
      persistedSlugStr = persistedSlug as string;
    });

    cy.then(() => {
      // Convert app name to expected slug format (lowercase, spaces replaced with hyphens)
      const expectedSlug = appNameStr
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""); // Remove any special characters except hyphens

      // Disable Static URL toggle
      _.agHelper.GetNClick(AdminsSettings.generalSettingsStaticUrl);

      // Verify the confirmation modal appears for disabling
      _.agHelper.AssertElementVisibility(AdminsSettings.staticUrlConfirmationModal);
      _.agHelper.AssertContains("Disable App Static URL", "be.visible");

      // Confirm disabling in the modal
      _.agHelper.GetNClickByContains(AdminsSettings.staticUrlConfirmationConfirm, "Disable Static URL");

      // Wait for the snackbar notification
      _.agHelper.ValidateToastMessage("Static URL disabled. The app has reverted to default Appsmith URLs.");

      // Verify the slug input field is no longer visible (toggle is off)
      _.agHelper.AssertElementAbsence(AdminsSettings.generalSettingsStaticAppSlug);

      // Re-enable Static URL toggle
      _.agHelper.GetNClick(AdminsSettings.generalSettingsStaticUrl);

      // Wait for the API call to fetch new slug suggestion
      _.assertHelper.WaitForNetworkCall("@fetchAppSlugSuggestion").then((response: any) => {
        const newSuggestedSlug = response.body.data;

        // Verify the slug input field is visible again
        _.agHelper.AssertElementVisibility(AdminsSettings.generalSettingsStaticAppSlug);
        _.agHelper.AssertText(AdminsSettings.generalSettingsStaticAppSlug, "val", newSuggestedSlug);

        // Verify the new slug is different from the previously persisted slug
        expect(newSuggestedSlug).to.not.eq(persistedSlugStr);

        // Verify the new slug starts with the expected slug derived from the application name
        // Backend appends a random hash after a hyphen for uniqueness
        expect(newSuggestedSlug).to.satisfy((slug: string) => 
          slug.startsWith(expectedSlug)
        );
      });
    });
  });
});
