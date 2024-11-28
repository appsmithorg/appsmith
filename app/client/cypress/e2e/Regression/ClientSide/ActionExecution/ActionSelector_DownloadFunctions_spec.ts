import {
  agHelper,
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
} from "../../../../support/Pages/EditorNavigation";
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
      agHelper.GetText(jsEditor._jsObjName).then((jsObjectName: string) => {
        cy.wrap(jsObjectName).as("jsObjectName");
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      cy.get("@jsObjectName").then((jsObjectName: string) => {
        console.log("Mera variable: ", jsObjectName);
        propPane.EnterJSContext(
          "onClick",
          `{{${jsObjectName}.myFun1()}}`,
          true,
          false,
        );
      });
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Success");
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Success");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.WaitUntilEleAppear(locators._jsToggle("onClick"));
      propPane.ToggleJSMode("onClick", false);
      agHelper.WaitUntilEleAppear(
        propPane._actionCardByTitle("Execute a JS function"),
      );
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    // Open github bug is there: https://github.com/appsmithorg/appsmith/issues/37720
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
          myFun1 () {
            {{ 
              download('http://host.docker.internal:4200/photo-1503469432756-4aae2e18d881', 'flower_2_1', '')
                .then(() => {
              const filePath = 'cypress/downloads/flower_2_1';
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
      agHelper.GetText(jsEditor._jsObjName).then((jsObjectName: string) => {
        cy.wrap(jsObjectName).as("jsObjectName");
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      cy.get("@jsObjectName").then((jsObjectName: string) => {
        console.log("Mera variable: ", jsObjectName);
        propPane.EnterJSContext(
          "onClick",
          `{{${jsObjectName}.myFun1()}}`,
          true,
          false,
        );
      });
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Failed as Expected");
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Failed as Expected");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.WaitUntilEleAppear(locators._jsToggle("onClick"));
      propPane.ToggleJSMode("onClick", false);
      agHelper.WaitUntilEleAppear(
        propPane._actionCardByTitle("Execute a JS function"),
      );
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
          myFun1 () {
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
      agHelper.GetText(jsEditor._jsObjName).then((jsObjectName: string) => {
        cy.wrap(jsObjectName).as("jsObjectName");
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      cy.get("@jsObjectName").then((jsObjectName: string) => {
        console.log("Mera variable: ", jsObjectName);
        propPane.EnterJSContext(
          "onClick",
          `{{${jsObjectName}.myFun1()}}`,
          true,
          false,
        );
      });
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Failed", 0, 1);
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Failed", 0, 2);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.WaitUntilEleAppear(locators._jsToggle("onClick"));
      propPane.ToggleJSMode("onClick", false);
      agHelper.WaitUntilEleAppear(
        propPane._actionCardByTitle("Execute a JS function"),
      );
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    it("4. To verify how the function behaves when an unsupported or incorrect file type is specified. The file should not download, or it should be unusable due to the incorrect file type.", () => {
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
          myFun1() {
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
      agHelper.GetText(jsEditor._jsObjName).then((jsObjectName: string) => {
        cy.wrap(jsObjectName).as("jsObjectName");
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      cy.get("@jsObjectName").then((jsObjectName: string) => {
        console.log("Mera variable: ", jsObjectName);
        propPane.EnterJSContext(
          "onClick",
          `{{${jsObjectName}.myFun1()}}`,
          true,
          false,
        );
      });
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Failed as Expected");
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Failed as Expected");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.WaitUntilEleAppear(locators._jsToggle("onClick"));
      propPane.ToggleJSMode("onClick", false);
      agHelper.WaitUntilEleAppear(
        propPane._actionCardByTitle("Execute a JS function"),
      );
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    it("5. To verify the download() function when no file name is provided. The download should fail, or the file should have a default or incorrect name.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Download");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Data to download"),
        "http://host.docker.internal:4200/photo-1503469432756-4aae2e18d881.jpeg",
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
          myFun1 () {
        {{download('http://host.docker.internal:4200/photo-1503469432756-4aae2e18d881.jpeg', '', 'image/jpeg').then(() => {
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
      agHelper.GetText(jsEditor._jsObjName).then((jsObjectName: string) => {
        cy.wrap(jsObjectName).as("jsObjectName");
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      cy.get("@jsObjectName").then((jsObjectName: string) => {
        console.log("Mera variable: ", jsObjectName);
        propPane.EnterJSContext(
          "onClick",
          `{{${jsObjectName}.myFun1()}}`,
          true,
          false,
        );
      });
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Failed", 0, 1);
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Failed", 0, 2);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.WaitUntilEleAppear(locators._jsToggle("onClick"));
      propPane.ToggleJSMode("onClick", false);
      agHelper.WaitUntilEleAppear(
        propPane._actionCardByTitle("Execute a JS function"),
      );
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    it("6. To verify if the download() function correctly downloads an image file.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Download");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Data to download"),
        "http://host.docker.internal:4200/photo-1503469432756-4aae2e18d881.jpeg",
      );
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("File name with extension"),
        "flower_6.jpeg",
      );

      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      cy.readFile("cypress/downloads/flower_6.jpeg", { timeout: 60000 }).should(
        "exist",
      );

      // deploy verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      cy.readFile("cypress/downloads/flower_6.jpeg", { timeout: 60000 }).should(
        "exist",
      );

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      // JSobject verification
      const jsObjectBody = `export default {
          myFun1 () {
            {{download('http://host.docker.internal:4200/photo-1503469432756-4aae2e18d881.jpeg', 'flower_6_1.jpeg', 'image/jpeg').then(() => {
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
      agHelper.GetText(jsEditor._jsObjName).then((jsObjectName: string) => {
        cy.wrap(jsObjectName).as("jsObjectName");
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      cy.get("@jsObjectName").then((jsObjectName: string) => {
        console.log("Mera variable: ", jsObjectName);
        propPane.EnterJSContext(
          "onClick",
          `{{${jsObjectName}.myFun1()}}`,
          true,
          false,
        );
      });
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Success");
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Success");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.WaitUntilEleAppear(locators._jsToggle("onClick"));
      propPane.ToggleJSMode("onClick", false);
      agHelper.WaitUntilEleAppear(
        propPane._actionCardByTitle("Execute a JS function"),
      );
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    it("7. To verify the behavior when the fileType does not match the file extension in the fileName. The file should download but may be unusable due to the mismatch between file extension and type.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Download");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Data to download"),
        "http://host.docker.internal:4200/photo-1503469432756-4aae2e18d881.jpeg",
      );
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("File name with extension"),
        "flower_7.png",
      );

      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      cy.readFile("cypress/downloads/flower_7.png", { timeout: 60000 }).should(
        "exist",
      );

      // deploy verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      cy.readFile("cypress/downloads/flower_7.png", { timeout: 60000 }).should(
        "exist",
      );

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      // JSobject verification
      const jsObjectBody = `export default {
          myFun1 () {
            {{ 
              download('http://host.docker.internal:4200/photo-1503469432756-4aae2e18d881.jpeg', 'flower_7_1.png', 'image/jpeg')
                .then(() => {
                  const filePath = 'cypress/downloads/flower_7_1.png';
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
      agHelper.GetText(jsEditor._jsObjName).then((jsObjectName: string) => {
        cy.wrap(jsObjectName).as("jsObjectName");
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      cy.get("@jsObjectName").then((jsObjectName: string) => {
        console.log("Mera variable: ", jsObjectName);
        propPane.EnterJSContext(
          "onClick",
          `{{${jsObjectName}.myFun1()}}`,
          true,
          false,
        );
      });
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Failed as Expected");
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Failed as Expected");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.WaitUntilEleAppear(locators._jsToggle("onClick"));
      propPane.ToggleJSMode("onClick", false);
      agHelper.WaitUntilEleAppear(
        propPane._actionCardByTitle("Execute a JS function"),
      );
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    it.only("8. To verify if the download() function downloads query data as a CSV file.", () => {
      // Create a mock query data
      const queryData = [
        { name: "John Doe", age: 30, city: "New York" },
        { name: "Jane Smith", age: 25, city: "Los Angeles" },
      ];
      const csvData = queryData
        .map((row) => Object.values(row).join(","))
        .join("\n");

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Download");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Data to download"),
        csvData,
      );
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("File name with extension"),
        "data.csv",
      );

      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      cy.readFile("cypress/downloads/data.csv", { timeout: 60000 }).should(
        "exist",
      );

      // deploy verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      cy.readFile("cypress/downloads/data.csv", { timeout: 60000 }).should(
        "exist",
      );

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      const jsObjectBody = `export default {
        async myFun1() {
          try {
            await download(
              \`John Doe,30,New York
              Jane Smith,25,Los Angeles\`,  // Template literal allows multi-line strings
              'data_1.csv',
              'text/csv'
            );
            showAlert('Download Success', '');
          } catch (error) {
            showAlert('Download Failed', '');
          }
        },
      };`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });
      agHelper.GetText(jsEditor._jsObjName).then((jsObjectName: string) => {
        cy.wrap(jsObjectName).as("jsObjectName");
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      cy.get("@jsObjectName").then((jsObjectName: string) => {
        console.log("Mera variable: ", jsObjectName);
        propPane.EnterJSContext(
          "onClick",
          `{{${jsObjectName}.myFun1()}}`,
          true,
          false,
        );
      });
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Success");
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Download Success");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.WaitUntilEleAppear(locators._jsToggle("onClick"));
      propPane.ToggleJSMode("onClick", false);
      agHelper.WaitUntilEleAppear(
        propPane._actionCardByTitle("Execute a JS function"),
      );
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });
  },
);
