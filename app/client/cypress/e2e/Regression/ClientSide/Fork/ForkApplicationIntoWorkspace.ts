// import ReconnectLocators from "../../../../locators/ReconnectLocators";
// import {
//   agHelper,
//   homePage,
//   locators,
// } from "../../../../support/Objects/ObjectsCore";
// import EditorNavigation from "../../../../support/Pages/EditorNavigation";

// describe("Fork Application", { tags: ["@tag.Fork"] }, () => {
//   let workspaceName: any;
//   let appName: any;
//   before(() => {
//     cy.generateUUID().then((uid: any) => {
//       workspaceName = uid;
//       appName = uid + "App";
//       homePage.NavigateToHome();
//       homePage.CreateNewWorkspace(workspaceName);
//       homePage.ImportApp(
//         "OldApp_DSTesting1.9.24_Latest_29August2024_withuiforframeowrk.json",
//         workspaceName,
//       );
//       agHelper.GetNClick(ReconnectLocators.SkipToAppBtn);
//     });
//   });
//   //Bug: https://github.com/appsmithorg/appsmith/issues/35527
//   it.skip("1. Verify fork application into same workspace", () => {
//     agHelper.GetNClick(homePage._homeIcon);
//     homePage.ForkApplication("OldApp_DSTesting1.9.24", workspaceName);
//     agHelper.GetNClick(ReconnectLocators.SkipToAppBtn);
//     // Open workspace and select forked app
//     homePage.NavigateToHome();
//     homePage.SelectWorkspace(workspaceName);
//     homePage.EditAppFromAppHover("OldApp_DSTesting1.9.24 (1)");

//     EditorNavigation.NavigateToPage("Oracle", true);
//     agHelper.AssertElementVisibility(locators._tableWidget);
//     EditorNavigation.NavigateToPage("PostGreSQL", true);
//     agHelper.AssertElementVisibility(locators._tableWidget);
//     EditorNavigation.NavigateToPage("S3", true);
//     agHelper.AssertElementVisibility(locators._tableWidget);
//   });

//   //Bug: https://github.com/appsmithorg/appsmith/issues/35527
//   it.skip("2. Verify fork application into different workspace", () => {
//     let newWorkspace = workspaceName + "WS2";
//     homePage.CreateNewWorkspace(newWorkspace, true);
//     homePage.SelectWorkspace(workspaceName);
//     homePage.ForkApplication("OldApp_DSTesting1.9.24", newWorkspace);
//     agHelper.GetNClick(ReconnectLocators.SkipToAppBtn);
//     // Open workspace and select forked app
//     homePage.NavigateToHome();
//     homePage.SelectWorkspace(newWorkspace);
//     homePage.EditAppFromAppHover("OldApp_DSTesting1.9.24");

//     EditorNavigation.NavigateToPage("Oracle", true);
//     agHelper.AssertElementVisibility(locators._tableWidget);
//     EditorNavigation.NavigateToPage("PostGreSQL", true);
//     agHelper.AssertElementVisibility(locators._tableWidget);
//     EditorNavigation.NavigateToPage("S3", true);
//     agHelper.AssertElementVisibility(locators._tableWidget);
//   });
// });
