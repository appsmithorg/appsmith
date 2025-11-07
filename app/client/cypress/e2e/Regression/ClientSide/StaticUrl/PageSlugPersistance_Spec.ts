import * as _ from "../../../../support/Objects/ObjectsCore";
import PageList from "../../../../support/Pages/PageList";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import AdminsSettings from "../../../../locators/AdminsSettings";

describe(
  "Static URL - Page Slug Persistence",
  { tags: ["@tag.Settings"] },
  () => {
    let applicationSlug: string;
    let page1Slug: string;
    let page2Slug: string;
    let page2Name: string;
    let oldPage1Route: string;
    let oldPage2Route: string;

    before(() => {
      // Navigate to General Settings
      _.appSettings.OpenAppSettings();
      _.appSettings.GoToGeneralSettings();

      // Before enabling static URL, get the existing routes for Page1 and Page2
      // Navigate to Page1 settings to get the old route
      _.appSettings.GoToPageSettings("Page1");

      // Get the route path directly using the test attribute
      _.agHelper.AssertElementVisibility(AdminsSettings.pageRoute);
      _.agHelper.GetText(AdminsSettings.pageRoute, "text").then((route) => {
        oldPage1Route = (route as string).trim();
      });

      // Create Page2 before enabling static URL to get its old route
      PageList.AddNewPage("New blank page").then((newPageName) => {
        if (!newPageName) return;

        page2Name = newPageName;

        // Navigate to Page2 settings to get the old route
        _.appSettings.OpenAppSettings();
        _.appSettings.GoToPageSettings(newPageName);

        // Get the route path directly using the test attribute
        _.agHelper.AssertElementVisibility(AdminsSettings.pageRoute);
        _.agHelper.GetText(AdminsSettings.pageRoute, "text").then((route) => {
          oldPage2Route = (route as string).trim();
        });
      });

      // Navigate back to General Settings
      _.appSettings.OpenAppSettings();
      _.appSettings.GoToGeneralSettings();

      // Enable Static URL toggle
      _.agHelper.GetNClick(AdminsSettings.generalSettingsStaticUrl);

      // Wait for the API call to complete and get the auto-generated application slug
      _.assertHelper.AssertNetworkStatus("@fetchAppSlugSuggestion", 200);
      cy.get("@fetchAppSlugSuggestion").then((interception: any) => {
        applicationSlug = interception.response.body.data;

        // Verify the slug input field is visible and contains the suggested slug
        _.agHelper.AssertElementVisibility(
          AdminsSettings.generalSettingsStaticAppSlug,
        );
        _.agHelper.AssertText(
          AdminsSettings.generalSettingsStaticAppSlug,
          "val",
          applicationSlug,
        );

        // Click on "Apply" button to open confirmation modal
        _.agHelper.AssertElementEnabledDisabled(
          AdminsSettings.staticUrlConfirmationConfirm,
          0,
          false,
        );
        _.agHelper.GetNClickByContains(
          AdminsSettings.staticUrlConfirmationConfirm,
          "Apply",
        );

        // Verify the modal appears with title "Change App Slug"
        _.agHelper.AssertElementVisibility(
          AdminsSettings.staticUrlConfirmationModal,
        );
        _.agHelper.AssertContains("Change App Slug", "be.visible");

        // Click on "Change App Slug" button in the modal to confirm
        _.agHelper.GetNClickByContains(
          AdminsSettings.staticUrlConfirmationConfirm,
          "Change App Slug",
        );

        _.agHelper.ValidateToastMessage("App slug updated");

        // Navigate to Page Settings of the first page
        _.appSettings.GoToPageSettings("Page1");
      });
    });

    it("1. Should auto-generate page slug from page name and show in URL preview", () => {
      // Get the current page name
      _.agHelper
        .GetText(AdminsSettings.pageSettingsName, "val")
        .then((pageName) => {
          const pageNameStr = pageName as string;
          // Convert page name to expected slug format (lowercase, spaces replaced with hyphens)
          const expectedPageSlug = pageNameStr
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, ""); // Remove any special characters except hyphens

          // Get the current page slug from the input field
          _.agHelper
            .GetText(AdminsSettings.pageSettingsStaticPageSlug, "val")
            .then((pageSlug) => {
              const pageSlugStr = pageSlug as string;

              // Verify the page slug starts with the expected slug derived from the page name
              // Backend may append a random hash after a hyphen for uniqueness
              expect(pageSlugStr).to.satisfy((slug: string) =>
                slug.startsWith(`${expectedPageSlug}`),
              );

              // Verify the URL preview contains both the application slug and page slug
              _.agHelper.AssertContains(
                `/app/${applicationSlug}/${pageSlugStr}`,
                "be.visible",
              );
            });
        });
    });

    it("2. Should automatically persist page slug when available and reflect on page reload", () => {
      // Get the current page slug
      _.agHelper
        .GetText(AdminsSettings.pageSettingsStaticPageSlug, "val")
        .then((currentPageSlug) => {
          const currentPageSlugStr = currentPageSlug as string;

          // Modify the page slug by appending "1"
          const modifiedPageSlug = currentPageSlugStr + "1";
          _.agHelper.ClearNType(
            AdminsSettings.pageSettingsStaticPageSlug,
            modifiedPageSlug,
          );

          // Verify the "Available" message appears
          _.agHelper.AssertContains("Available", "be.visible");

          // Verify the URL preview shows the modified page slug
          _.agHelper.AssertContains(
            `/app/${applicationSlug}/${modifiedPageSlug}`,
            "be.visible",
          );

          // Blur the input field to trigger auto-persistence (no confirmation modal)
          cy.get(AdminsSettings.pageSettingsStaticPageSlug).blur();

          // Verify "Deploy app to apply this slug" message appears
          _.agHelper.AssertContains(
            "Deploy app to apply this slug",
            "be.visible",
          );

          // Reload the page
          _.agHelper.CypressReload();

          // Wait for the page to load and navigate back to page settings
          _.appSettings.OpenAppSettings();
          _.appSettings.GoToPageSettings("Page1");

          // Verify the page slug persists after reload
          _.agHelper.AssertElementVisibility(
            AdminsSettings.pageSettingsStaticPageSlug,
          );
          _.agHelper.AssertText(
            AdminsSettings.pageSettingsStaticPageSlug,
            "val",
            modifiedPageSlug,
          );

          // Store page1 slug for later use
          page1Slug = modifiedPageSlug;
        });
    });

    it("3. Should show unavailable status for duplicate page slug and auto-persist when unique", () => {
      // Get the persisted page slug from test 2
      _.agHelper
        .GetText(AdminsSettings.pageSettingsStaticPageSlug, "val")
        .then((persistedPageSlug) => {
          const persistedPageSlugStr = persistedPageSlug as string;

          // Navigate to Page2 settings (Page2 was created in before hook)
          _.appSettings.OpenAppSettings();
          _.appSettings.GoToPageSettings(page2Name);

          // Try to use the same page slug from the previous page
          _.agHelper.ClearNType(
            AdminsSettings.pageSettingsStaticPageSlug,
            persistedPageSlugStr,
          );

          // Verify the "Unavailable" message appears
          _.agHelper.AssertContains(
            "There is already a page with this slug.",
            "be.visible",
          );

          // Change to another unique value
          const uniquePageSlug = persistedPageSlugStr + "2";
          _.agHelper.ClearNType(
            AdminsSettings.pageSettingsStaticPageSlug,
            uniquePageSlug,
          );

          // Verify the "Available" message appears
          _.agHelper.AssertContains("Available", "be.visible");

          // Blur the input field to trigger auto-persistence
          cy.get(AdminsSettings.pageSettingsStaticPageSlug).blur();

          // Verify "Deploy app to apply this slug" message appears
          _.agHelper.AssertContains(
            "Deploy app to apply this slug",
            "be.visible",
          );

          // Reload the page
          _.agHelper.CypressReload();

          // Wait for the page to load and navigate back to Page2 settings
          _.appSettings.OpenAppSettings();
          _.appSettings.GoToPageSettings(page2Name);

          // Verify the page slug persists after reload
          _.agHelper.AssertElementVisibility(
            AdminsSettings.pageSettingsStaticPageSlug,
          );
          _.agHelper.AssertText(
            AdminsSettings.pageSettingsStaticPageSlug,
            "val",
            uniquePageSlug,
          );

          // Store page2 slug for later use
          page2Slug = uniquePageSlug;
        });
    });
    it("4. Should validate routes are accessible in deployed application with static URLs", () => {
      // Navigate to Page1
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      // Add Text widget to Page1
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT, 300, 300);

      // Select the Text widget and update its text
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      _.propPane.UpdatePropertyFieldValue("Text", "This is page1");

      // Navigate to Page2 (stored from test 3)
      EditorNavigation.SelectEntityByName(page2Name, EntityType.Page);

      // Add Text widget to Page2
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT, 300, 300);

      // Select the Text widget and update its text
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      _.propPane.UpdatePropertyFieldValue("Text", "This is page2");

      // Deploy the application
      _.deployMode.DeployApp();

      // First, navigate to Page1 after deployment
      cy.visit(`/app/${applicationSlug}/${page1Slug}`, { timeout: 10000 });

      // Validate the URL contains the static URL route for Page1
      cy.url().should("include", `/app/${applicationSlug}/${page1Slug}`);

      // Assert the text "This is page1" is visible on Page1
      _.agHelper.AssertContains("This is page1", "be.visible");

      // Navigate to Page2
      cy.visit(`/app/${applicationSlug}/${page2Slug}`, { timeout: 10000 });

      // Validate the URL contains the static URL route for Page2
      cy.url().should("include", `/app/${applicationSlug}/${page2Slug}`);

      // Assert the text "This is page2" is visible on Page2
      _.agHelper.AssertContains("This is page2", "be.visible");

      // Navigate back to Page1
      cy.visit(`/app/${applicationSlug}/${page1Slug}`, { timeout: 10000 });

      // Validate the URL contains the static URL route for Page1
      cy.url().should("include", `/app/${applicationSlug}/${page1Slug}`);

      // Assert the text "This is page1" is visible on Page1
      _.agHelper.AssertContains("This is page1", "be.visible");
    });

    it("5. Should validate old routes still work and redirect to respective pages", () => {
      // Navigate to Page1 using the old route
      cy.visit(oldPage1Route, { timeout: 10000 });

      // Verify that Page1 opens correctly (should redirect or show Page1 content)
      // The old route should still work and show the page
      _.agHelper.AssertContains("This is page1", "be.visible");

      // Navigate to Page2 using the old route
      cy.visit(oldPage2Route, { timeout: 10000 });

      // Verify that Page2 opens correctly (should redirect or show Page2 content)
      // The old route should still work and show the page
      _.agHelper.AssertContains("This is page2", "be.visible");
    });

    it("6. Should validate only old routes work after disabling static URL", () => {
      // Navigate back to editor from deployed mode
      _.deployMode.NavigateBacktoEditor();

      // Navigate to General Settings
      _.appSettings.OpenAppSettings();
      _.appSettings.GoToGeneralSettings();

      // Disable Static URL toggle
      _.agHelper.GetNClick(AdminsSettings.generalSettingsStaticUrl);

      // Verify the confirmation modal appears for disabling
      _.agHelper.AssertElementVisibility(
        AdminsSettings.staticUrlConfirmationModal,
      );
      _.agHelper.AssertContains("Disable App Static URL", "be.visible");

      // Click on "Disable Static URL" button in the modal to confirm
      _.agHelper.GetNClickByContains(
        AdminsSettings.staticUrlConfirmationConfirm,
        "Disable Static URL",
      );

      // Wait for the snackbar notification
      _.agHelper.ValidateToastMessage(
        "Static URL disabled. The app has reverted to default Appsmith URLs.",
      );

      // Verify the slug input field is no longer visible (toggle is off)
      _.agHelper.AssertElementAbsence(
        AdminsSettings.generalSettingsStaticAppSlug,
      );

      // Deploy the application
      _.deployMode.DeployApp();

      // Verify that old routes still work
      // Navigate to Page1 using the old route
      cy.visit(oldPage1Route, { timeout: 10000 });
      _.agHelper.AssertContains("This is page1", "be.visible");

      // Navigate to Page2 using the old route
      cy.visit(oldPage2Route, { timeout: 10000 });
      _.agHelper.AssertContains("This is page2", "be.visible");

      // Verify that static URL routes do NOT work
      // Try to navigate to Page1 using static URL route - should fail or redirect
      cy.visit(`/app/${applicationSlug}/${page1Slug}`, {
        timeout: 10000,
        failOnStatusCode: false,
      });
      // The static URL route should not work - page should not show the expected content
      _.agHelper.AssertContains("This is page1", "not.exist");

      // Try to navigate to Page2 using static URL route - should fail or redirect
      cy.visit(`/app/${applicationSlug}/${page2Slug}`, {
        timeout: 10000,
        failOnStatusCode: false,
      });
      // The static URL route should not work - page should not show the expected content
      _.agHelper.AssertContains("This is page2", "not.exist");
    });
  },
);
