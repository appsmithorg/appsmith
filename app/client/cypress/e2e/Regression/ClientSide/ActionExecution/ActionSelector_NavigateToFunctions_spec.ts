import {
  agHelper,
  appSettings,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  jsEditor,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import { EntityItems } from "../../../../support/Pages/AssertHelper";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe(
  "JS to non-JS mode in Action Selector",
  { tags: ["@tag.JS", "@tag.Binding"] },
  () => {
    let pageTwoUrl: string = "";
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
      PageList.AddNewPage();
      cy.url().then((url) => {
        pageTwoUrl = url;
      });
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    });

    it("1. To verify trigger the action without editing any field - error should be for missing navigation path and not something arbitrary like unexpected token", () => {
      propPane.EnterJSContext("onClick", "{{navigateTo()}}", true, false);
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Navigate toSelect page",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.AssertElementVisibility(propPane._navigateToType("Page name"));

      dataSources.ValidateNSelectDropdown(
        "Choose page",
        "Select page",
        "Page2",
      );

      agHelper.GetNAssertElementText(
        propPane._actionPopupTextLabel,
        "Query params",
        "have.text",
        0,
      );

      agHelper.GetNClick(propPane._actionCollapsibleHeader("Query params"));
      propPane.UpdatePropertyFieldValue(
        "Query params",
        `{{
          {
          
          }
        }}`,
      );
      agHelper.ClickButton("Submit");
      agHelper.AssertURL(pageTwoUrl);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertURL(pageTwoUrl);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      const jsObjectBody = `export default {
          myFun1 () {
            {{navigateTo('Page2', {
 
            }, 'SAME_WINDOW');}}
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
      agHelper.AssertURL(pageTwoUrl);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertURL(pageTwoUrl);
      deployMode.NavigateBacktoEditor();
    });

    it("2. To verify add a widget navigation using URL containing widgetID", () => {
      EditorNavigation.SelectEntityByName("Page2", EntityType.Page);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 200, 600);
      cy.url().then((url) => {
        pageTwoUrl = url;
      });
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      propPane.SelectPlatformFunction("onClick", "Navigate to");
      propPane.SelectActionByTitleAndValue("Navigate to", "Select page");
      agHelper.GetNClick(propPane._navigateToType("URL"));
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Enter URL"),
        pageTwoUrl,
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      agHelper.AssertURL(pageTwoUrl);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertURL(pageTwoUrl);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      const jsObjectBody = `export default {
          myFun1 () {
            {{navigateTo('${pageTwoUrl}', {}, 'SAME_WINDOW');}}
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
      propPane.EnterJSContext("onClick", "{{JSObject2.myFun1()}}", true, false);
      agHelper.ClickButton("Submit");
      agHelper.AssertURL(pageTwoUrl);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertURL(pageTwoUrl);
    });

    it("3. To verify add a navigation using URL containing links to third party websites", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      const thirdPartyUrl = "https://www.google.com/";
      propPane.SelectPlatformFunction("onClick", "Navigate to");
      propPane.SelectActionByTitleAndValue("Navigate to", "Select page");
      agHelper.GetNClick(propPane._navigateToType("URL"));
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Enter URL"),
        thirdPartyUrl,
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      agHelper.AssertURL(thirdPartyUrl);
      agHelper.VisitNAssert(pageTwoUrl);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertURL(thirdPartyUrl);
      agHelper.VisitNAssert(pageTwoUrl);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      const jsObjectBody = `export default {
          myFun1 () {
            {{navigateTo('${thirdPartyUrl}', {}, 'SAME_WINDOW');}}
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
      propPane.EnterJSContext("onClick", "{{JSObject3.myFun1()}}", true, false);
      agHelper.ClickButton("Submit");
      agHelper.AssertURL(thirdPartyUrl);
      agHelper.VisitNAssert(pageTwoUrl);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertURL(thirdPartyUrl);
      agHelper.VisitNAssert(pageTwoUrl);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    });

    it("4. To verify navigation to a hidden page in same as well a new window", () => {
      PageList.AddNewPage();
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Page3",
        action: "Hide",
        entityType: EntityItems.Page,
      });
      EditorNavigation.SelectEntityByName("Page3", EntityType.Page);
      cy.url().then((url) => {
        pageTwoUrl = url;
      });
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      propPane.SelectPlatformFunction("onClick", "Navigate to");
      propPane.SelectActionByTitleAndValue("Navigate to", "Select page");
      agHelper.GetNClick(propPane._navigateToType("URL"));
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Enter URL"),
        pageTwoUrl,
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      agHelper.AssertURL(pageTwoUrl);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertURL(pageTwoUrl);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      const jsObjectBody = `export default {
          myFun1 () {
            {{navigateTo('${pageTwoUrl}', {}, 'SAME_WINDOW');}}
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
      propPane.EnterJSContext("onClick", "{{JSObject4.myFun1()}}", true, false);
      agHelper.ClickButton("Submit");
      agHelper.AssertURL(pageTwoUrl);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertURL(pageTwoUrl);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    });
  },
);
