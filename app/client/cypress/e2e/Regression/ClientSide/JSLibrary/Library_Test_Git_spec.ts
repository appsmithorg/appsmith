import {
  agHelper,
  entityExplorer,
  jsEditor,
  deployMode,
  installer,
  draggableWidgets,
  propPane,
  locators,
  apiPage,
  table,
  homePage,
  gitSync,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  AppSidebar,
  AppSidebarButton,
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";

describe(
  "Tests JS Libraries for Git connected app",
  { tags: ["@tag.excludeForAirgap", "@tag.JS", "@tag.Binding"] },
  () => {
    before(() => {
      gitSync.CreateNConnectToGit();
      gitSync.CreateGitBranch();

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 500, 100);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 200, 200);
      apiPage.CreateAndFillApi(
        "http://host.docker.internal:5001/v1/mock-api?records=5",
      );
      apiPage.RunAPI();
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.EnterJSContext("tabledata", `{{Api1.data}}`, true, false);
    });

    it("1. Verify moment library", () => {
      jsEditor.CreateJSObject(`showAlert(moment().daysInMonth().toString())`, {
        paste: true,
        completeReplace: false,
        toRun: true,
        shouldCreateNewJSObj: true,
        prettify: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        `{{JSObject1.myFun1();}}`,
        true,
        false,
      );
      agHelper.GetNClick(locators._widgetInDeployed("buttonwidget"));
      agHelper.WaitUntilAllToastsDisappear();

      // Deploy
      deployMode.DeployApp();
      agHelper.GetNClick(locators._widgetInDeployed("buttonwidget"));
      agHelper.WaitUntilAllToastsDisappear();
      deployMode.NavigateBacktoEditor();
    });

    it("2. Verify install/uninstall of Library ", () => {
      AppSidebar.navigate(AppSidebarButton.Libraries);
      installer.OpenInstaller();
      installer.InstallLibraryViaURL(
        "https://cdn.jsdelivr.net/npm/swiper@11.1.14/+esm",
        "swiper",
      );
      agHelper.WaitUntilAllToastsDisappear();
      installer.uninstallLibrary("swiper");
      installer.assertUnInstall("swiper");
    });

    it("3. Verify jspdf library", () => {
      AppSidebar.navigate(AppSidebarButton.Libraries);
      installer.OpenInstaller();
      installer.InstallLibrary("jspdf", "jspdf");
      jsEditor.CreateJSObject(
        `export default {
            genPDF: () => {
              const doc = new jspdf.jsPDF();
              doc.text('Users', 20, 20);
              doc.table(20, 30, Table1.tableData, Table1.columnOrder, {autoSize: true});
              download(doc.output(), 'users_list.pdf');
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

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        `{{JSObject2.genPDF();}}`,
        true,
        false,
      );
      agHelper.GetNClick(locators._widgetInDeployed("buttonwidget"));
      table.ValidateDownloadNVerify("users_list.pdf");

      // Deploy
      deployMode.DeployApp();
      agHelper.GetNClick(locators._widgetInDeployed("buttonwidget"));
      table.ValidateDownloadNVerify("users_list.pdf");
      deployMode.NavigateBacktoEditor();
    });

    it("4. Verify deleting jspdf library deletes all its references as well", () => {
      AppSidebar.navigate(AppSidebarButton.Libraries);
      installer.uninstallLibrary("jspdf");
      installer.assertUnInstall("jspdf");

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.GetNClick(locators._widgetInDeployed("buttonwidget"));

      if (CURRENT_REPO === REPO.EE) {
        agHelper.ValidateToastMessage(
          '"jspdf" is undefined . Please fix JSObject2.genPDF.',
        );
      } else {
        agHelper.ValidateToastMessage("jspdf is not defined");
      }

      // Deploy
      deployMode.DeployApp();
      agHelper.GetNClick(locators._widgetInDeployed("buttonwidget"));
      if (CURRENT_REPO === REPO.EE) {
        agHelper.ValidateToastMessage(
          '"jspdf" is undefined . Please fix JSObject2.genPDF.',
        );
      } else {
        agHelper.WaitUntilToastDisappear("jspdf is not defined");
      }
      deployMode.NavigateBacktoEditor();
      // Install jspdf and verify references are working
      AppSidebar.navigate(AppSidebarButton.Libraries);
      installer.OpenInstaller();
      installer.InstallLibrary("jspdf", "jspdf");
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.GetNClick(locators._widgetInDeployed("buttonwidget"));
      table.ValidateDownloadNVerify("users_list.pdf");

      // Deploy
      deployMode.DeployApp();
      agHelper.GetNClick(locators._widgetInDeployed("buttonwidget"));
      table.ValidateDownloadNVerify("users_list.pdf");
      deployMode.NavigateBacktoEditor();
    });
  },
);
