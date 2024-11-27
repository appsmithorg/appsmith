import {
  agHelper,
  apiPage,
  appSettings,
  deployMode,
  draggableWidgets,
  entityExplorer,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";
import commonlocators from "../../../../locators/commonlocators.json";

describe(
  "To verify action selector - Download function",
  { tags: ["@tag.JS"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
    });

    it("1. To verify the file downloads correctly without specifying the fileType, but with a file extension in the filename.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Download");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Data to download"),
        "http://host.docker.internal:4200/photo-1503469432756-4aae2e18d881.jpeg",
      );
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("File name with extension"),
        "flower_1.jpeg",
      );

      // cy.get(commonlocators.downloadFileType).click();
      // cy.get(commonlocators.singleSelectMenuItem)
      //   .contains("JPEG")
      //   .click({ force: true });

      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      cy.readFile("cypress/downloads/flower_1.jpeg", { timeout: 60000 }).should(
        "exist",
      );

      //deploy verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      cy.readFile("cypress/downloads/flower_1.jpeg", { timeout: 60000 }).should(
        "exist",
      );

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      // JSobject verification
      const jsObjectBody = `export default {
          myFun1 () {
            {{download('http://host.docker.internal:4200/photo-1503469432756-4aae2e18d881.jpeg', 'flower_2.jpeg', 'image/jpeg').then(() => {
            showAlert('Download Success', '');
          });}}
          },
        }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext("onClick", "{{JSObject1.myFun1()}}", true, false);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Success");
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Success");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    it("2. To verify the behavior of the download() function when no file extension is provided in the fileName. The download should fail, or the file should be unusable due to the lack of an extension.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Download");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Data to download"),
        "http://host.docker.internal:4200/photo-1503469432756-4aae2e18d881.jpeg",
      );
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("File name with extension"),
        "flower_2",
      );

      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      cy.readFile("cypress/downloads/flower_2", { timeout: 60000 }).should(
        "exist",
      );

      // deploy verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      cy.readFile("cypress/downloads/flower_2", { timeout: 60000 }).should(
        "exist",
      );

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      // JSobject verification
      const jsObjectBody = `export default {
          myFun2 () {
            {{download('http://host.docker.internal:4200/photo-1503469432756-4aae2e18d881', 'flower_2_1', '').then(() => {
            showAlert('Download Success', '');
          }).catch(() => {
            showAlert('Download Failed', '');
          });}}
          },
        }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext("onClick", "{{JSObject1.myFun2()}}", true, false);
      agHelper.ClickButton("Submit");
      cy.readFile("cypress/downloads/flower_2_1", { timeout: 60000 }).should(
        "exist",
      );
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      cy.readFile("cypress/downloads/flower_2_1", { timeout: 60000 }).should(
        "exist",
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    it("3. To verify the download() function when invalid or null data is passed. The download should fail, or an appropriate error message should be logged.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Download");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Data to download"),
        "testing",
      );
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("File name with extension"),
        "",
      );

      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Please enter a file name", 0, 2);

      // deploy verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Please enter a file name", 0, 2);

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      // JSobject verification
      const jsObjectBody = `export default {
          myFun3 () {
            {{download('', '', 'image/jpeg').then(() => {
            showAlert('Download Success', '');
          }).catch(() => {
            showAlert('Download Failed', '');
          });}}
          },
        }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext("onClick", "{{JSObject1.myFun3()}}", true, false);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Failed", 0, 1);
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Failed", 0, 2);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    it.only("4. To verify how the function behaves when an unsupported or incorrect file type is specified. The file should not download, or it should be unusable due to the incorrect file type.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Download");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Data to download"),
        "http://host.docker.internal:4200/photo-1503469432756-4aae2e18d881.jpeg",
      );
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("File name with extension"),
        "flower_4.txt",
      );

      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      cy.readFile("cypress/downloads/flower_4.txt", { timeout: 60000 }).should(
        "exist",
      );

      // deploy verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      cy.readFile("cypress/downloads/flower_4.txt", { timeout: 60000 }).should(
        "exist",
      );

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      // JSobject verification
      const jsObjectBody = `export default {
          myFun4() {
            {{ 
              download('http://host.docker.internal:4200/photo-1503469432756-4aae2e18d881.jpeg', 'flower_4_1', 'text/plain')
                .then(() => {
                  const filePath = 'cypress/downloads/flower_4_1';
                  cy.readFile(filePath, { timeout: 60000 }).then((content) => {
                    if (!content.startsWith('JPEG')) {
                      showAlert('Download Failed as Expected', 'success');
                      throw new Error('File content does not match expected MIME type.');
                    } else {
                      showAlert('Unexpected Success', 'error');
                    }
                  });
                })
                .catch((error) => {
                  showAlert('Download Failed as Expected', 'success');
                });
            }}
          },
        };`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext("onClick", "{{JSObject1.myFun4()}}", true, false);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Failed");
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Failed");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });
  },
);
