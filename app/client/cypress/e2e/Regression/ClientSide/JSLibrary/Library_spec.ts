import HomePage from "../../../../locators/HomePage";
import {
  agHelper,
  entityExplorer,
  jsEditor,
  deployMode,
  homePage,
  debuggerHelper,
  installer,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  AppSidebar,
  AppSidebarButton,
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Tests JS Libraries",
  { tags: ["@tag.excludeForAirgap", "@tag.JS", "@tag.Binding"] },
  () => {
    it("1. Validates Library install/uninstall", () => {
      AppSidebar.navigate(AppSidebarButton.Libraries);
      installer.OpenInstaller();
      installer.InstallLibrary("uuidjs", "UUID");
      installer.uninstallLibrary("uuidjs");
      installer.assertUnInstall("uuidjs");
    });

    it("2. Installs the library against a unique namespace when there is a collision with the existing entity", () => {
      AppSidebar.navigate(AppSidebarButton.Editor);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 200, 200);
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      entityExplorer.RenameEntityFromExplorer("Table1", "jsonwebtoken");
      AppSidebar.navigate(AppSidebarButton.Libraries);
      installer.OpenInstaller();
      installer.InstallLibrary("jsonwebtoken", "jsonwebtoken_1", true);
    });

    it("3. Checks jspdf library", () => {
      AppSidebar.navigate(AppSidebarButton.Libraries);
      installer.OpenInstaller();
      installer.InstallLibrary("jspdf", "jspdf");
      jsEditor.CreateJSObject(
        `export default {
      myFun1: () => {
        const doc = new jspdf.jsPDF();
        doc.addPage();
        doc.text(20, 100, 'Some Text.');
        return doc.output('datauristring');
      }
    }`,
        {
          paste: true,
          completeReplace: true,
          toRun: false,
          shouldCreateNewJSObj: true,
          prettify: true,
        },
      );
      jsEditor.RunJSObj();
      debuggerHelper.ClickResponseTab();
      agHelper.AssertContains("data:application/pdf;filename=generated.pdf");
    });

    it("4. ESM build should pass installation, uninstallation and reinstallation", () => {
      AppSidebar.navigate(AppSidebarButton.Libraries);
      installer.OpenInstaller();
      installer.InstallLibraryViaURL(
        "https://cdn.jsdelivr.net/npm/fast-xml-parser@4.2.7/+esm",
        "fast_xml_parser",
      );
      agHelper.Sleep(2000);
      // Uninstallation should succeed
      installer.uninstallLibrary("fast_xml_parser");
      installer.assertUnInstall("fast_xml_parser");

      // Reinstallation should succeed with the same accessor
      installer.OpenInstaller();
      installer.InstallLibraryViaURL(
        "https://cdn.jsdelivr.net/npm/fast-xml-parser@4.2.7/+esm",
        "fast_xml_parser",
      );
    });

    it("5. Shows list of recommended libraries", () => {
      const recommendedLibraryNames = ["jsonwebtoken", "jspdf", "bcryptjs"];
      AppSidebar.navigate(AppSidebarButton.Libraries);
      installer.OpenInstaller();
      for (const [index, recommendedLib] of recommendedLibraryNames.entries()) {
        cy.contains(recommendedLib);
      }
    });

    it("6. Checks installation in exported/forked app", () => {
      homePage.NavigateToHome();
      homePage.ImportApp("library_export.json");
      homePage.AssertImportToast(0);
      agHelper.ValidateToastMessage("true");
      agHelper.WaitUntilAllToastsDisappear();

      //Checks installation in forked app
      homePage.NavigateToHome();
      homePage.ForkApplication("Library_export");
      agHelper.ValidateToastMessage("true");
      agHelper.WaitUntilAllToastsDisappear();

      //Deploy app and check installation
      deployMode.DeployApp();
      agHelper.WaitUntilToastDisappear("true");
      deployMode.NavigateBacktoEditor();
      agHelper.ValidateToastMessage("true");
    });

    it("7. Tests library access and installation in public apps", () => {
      let appURL = "";
      cy.get(HomePage.shareApp).click();
      //@ts-expect-error no type access
      cy.enablePublicAccess(true);
      deployMode.DeployApp();
      cy.url().then((url) => {
        appURL = url;
        homePage.LogOutviaAPI();
        cy.visit(appURL);
        agHelper.AssertContains("true");
      });
    });
  },
);
