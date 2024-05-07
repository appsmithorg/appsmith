import {
  agHelper,
  assertHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  homePage,
  locators,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Modal Widget test cases",
  { tags: ["@tag.Widget", "@tag.Modal"] },
  function () {
    const image = (src: string) => 'img[src="' + src + '"]';
    const jpgImg = "https://jpeg.org/images/jpegsystems-home.jpg";
    const gifImg =
      "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/5eeea355389655.59822ff824b72.gif";

    it("1. Modal widget functionality", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MODAL, 300, 300);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", "{{showModal(Modal1.name);}}");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.BUTTON));
      agHelper.WaitUntilEleAppear(
        locators._widgetInDeployed(draggableWidgets.BUTTON),
      ); //Wait for widgets to settle

      //Verify that the Modal widget opens correctly when configured on a button click.
      agHelper.ClickButton("Submit");
      agHelper.WaitUntilEleAppear(locators._modal);
      agHelper.AssertElementExist(locators._modal);

      //Verify that the Modal widget is closed and no longer visible on the screen on clicking the "X" button.
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
      );
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
      );
      agHelper.WaitUntilEleDisappear(locators._modal);
      agHelper.AssertElementAbsence(locators._modal);

      //Verify that clicking outside the Modal widget closes it as expected when Quick dismiss is enabled
      agHelper.ClickButton("Submit");
      agHelper.WaitUntilEleAppear(locators._modal);
      agHelper.AssertElementExist(locators._modal);
      agHelper.ClickOutside(350, 150, false);
      agHelper.WaitUntilEleDisappear(locators._modal);
      agHelper.AssertElementAbsence(locators._modal);
    });

    it("2. Verify that multiple Modal widgets can be opened simultaneously.", () => {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", false);
      propPane.CreateModal("onClick");
      propPane.CreateModal("onClick");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.BUTTON));
      agHelper.WaitUntilEleAppear(
        locators._widgetInDeployed(draggableWidgets.BUTTON),
      ); //Wait for widgets to settle
      agHelper.ClickButton("Submit");
      agHelper.AssertElementLength(locators._modal, 3);
      agHelper.AssertElementVisibility(locators._modal, true, 2);
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
        2,
      );
      agHelper.AssertElementVisibility(locators._modal, true, 1);
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
        1,
      );
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
      );
      agHelper.AssertElementAbsence(locators._modal);
    });

    it("3. Verify that scroll appears when there are multiple widgets in modal", () => {
      agHelper.ClickButton("Submit");
      agHelper.AssertProperty(locators._modal, "scrollTop", 0);
      deployMode.NavigateBacktoEditor();
      homePage.NavigateToHome();

      //Contains modal with couple of widgets(image, text, select, input, table, container, icon button, json form , list, tab)
      homePage.ImportApp("modalWidgetTestApp.json");
      EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);

      //Auto height
      propPane.AssertPropertiesDropDownValues("Height", [
        "Auto Height",
        "Fixed",
      ]);
      propPane.AssertPropertiesDropDownCurrentValue("Height", "Auto Height");

      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.BUTTON));

      agHelper.ClickButton("Submit");
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.AssertElementVisibility(
        locators._modal +
          " " +
          locators._widgetInDeployed(draggableWidgets.IMAGE),
      );
      agHelper.AssertElementVisibility(
        locators._modal +
          " " +
          locators._widgetInDeployed(draggableWidgets.LIST_V2),
      );
      agHelper
        .GetElement(locators._modal)
        .invoke("scrollTop")
        .should("be.greaterThan", 400);
      agHelper.ScrollTo(locators._modal, "bottom");
      agHelper.AssertElementVisibility(
        locators._modal +
          " " +
          locators._widgetInDeployed(draggableWidgets.TABLE),
      );
      deployMode.NavigateBacktoEditor();

      //Fixed height
      EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("Height", "Fixed");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.BUTTON));
      agHelper.ClickButton("Submit");
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.AssertElementVisibility(
        locators._modal +
          " " +
          locators._widgetInDeployed(draggableWidgets.IMAGE),
      );
      agHelper.AssertElementVisibility(
        locators._modal +
          " " +
          locators._widgetInDeployed(draggableWidgets.LIST_V2),
      );
      agHelper
        .GetElement(locators._modal)
        .invoke("scrollTop")
        .should("be.greaterThan", 400);
      agHelper.ScrollTo(locators._modal, "bottom");
      agHelper.AssertElementVisibility(
        locators._modal +
          " " +
          locators._widgetInDeployed(draggableWidgets.TABLE),
      );
    });

    it("4. Verify that multiple widgets within the Modal widget can communicate without errors.", () => {
      agHelper.ScrollTo(locators._modal, "top");

      //Assert all the widgets in modal are visible
      agHelper.AssertElementVisibility(
        locators._modal +
          " " +
          locators._widgetInDeployed(draggableWidgets.INPUT_V2),
      );
      agHelper.AssertElementVisibility(
        locators._modal +
          " " +
          locators._widgetInDeployed(draggableWidgets.SELECT),
      );
      agHelper.AssertElementVisibility(
        locators._modal +
          " " +
          locators._widgetInDeployed(draggableWidgets.TEXT),
      );
      agHelper.AssertElementVisibility(
        locators._modal +
          " " +
          locators._widgetInDeployed(draggableWidgets.IMAGE),
      );
      agHelper.AssertElementVisibility(
        locators._modal +
          " " +
          locators._widgetInDeployed(draggableWidgets.LIST_V2),
      );
      agHelper.AssertElementVisibility(
        locators._modal +
          " " +
          locators._widgetInDeployed(draggableWidgets.JSONFORM),
      );

      //Verify that complex layouts with nested widgets are displayed correctly within the Modal widget.
      agHelper.AssertElementVisibility(
        locators._modal +
          " " +
          locators._widgetInDeployed(draggableWidgets.CONTAINER),
      );
      agHelper.AssertElementVisibility(
        locators._modal +
          " " +
          locators._widgetInDeployed(draggableWidgets.CONTAINER) +
          " " +
          locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
      );
      agHelper.AssertElementVisibility(
        locators._modal +
          " " +
          locators._widgetInDeployed(draggableWidgets.CONTAINER) +
          " " +
          locators._widgetInDeployed(draggableWidgets.TAB),
      );
      agHelper.AssertElementVisibility(
        locators._modal +
          " " +
          locators._widgetInDeployed(draggableWidgets.CONTAINER) +
          " " +
          locators._widgetInDeployed(draggableWidgets.TAB) +
          " " +
          locators._widgetInDeployed(draggableWidgets.TABLE),
      );

      //Input
      agHelper.TypeText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "test",
      );

      //Validate input widget binding to select dropdown
      agHelper.SelectDropDown("test1");
      agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
        expect($selectedValue).to.eq("test1");
      });
      agHelper.SelectDropDown("test2");
      agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
        expect($selectedValue).to.eq("test2");
      });

      //Image
      agHelper.AssertElementExist(image(gifImg));

      //List
      agHelper.AssertElementExist(image(jpgImg));
      agHelper.AssertElementLength(image(jpgImg), 3);
      agHelper.GetNAssertContains(
        locators._widgetInDeployed(draggableWidgets.TEXT),
        "Blue",
      );
      agHelper.GetNAssertContains(
        locators._widgetInDeployed(draggableWidgets.TEXT),
        "Green",
      );
      agHelper.GetNAssertContains(
        locators._widgetInDeployed(draggableWidgets.TEXT),
        "Red",
      );

      //JSON Form
      agHelper.TypeText(locators._jsonFormInputField("name"), "test user");
      agHelper.TypeText(
        locators._jsonFormInputField("date_of_birth"),
        "12/03/1999",
      );
      agHelper.TypeText(locators._jsonFormInputField("employee_id"), "1234");
      agHelper.ClickButton("Submit", 1);
      agHelper.ValidateToastMessage("Form submitted!");

      //Nested widgets
      //Icon button
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
        1,
      );
      assertHelper.WaitForNetworkCall("@postExecute").then((response: any) => {
        const name = response.body.data.body[0].name;
        agHelper.ValidateToastMessage("Executed api!");

        //Tab
        agHelper.GetNClick(propPane._tabId1);

        //Table
        table.SearchTable(name);
        table.ReadTableRowColumnData(0, 5, "v2").then(($cellData) => {
          expect($cellData).to.contain(name);
        });
        table.SelectTableRow(0, 0, true, "v2");

        //Text
        agHelper.ScrollTo(locators._modal, "top");
        agHelper.AssertContains(
          name,
          "be.visible",
          locators._modal +
            " " +
            locators._widgetInDeployed(draggableWidgets.TEXT),
        );
      });
    });

    it("5. Verify that the Modal widget opens correctly when configured on various events for different widget types.", () => {
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
      );
      agHelper.AssertElementAbsence(locators._modal);

      //Select - onOptionChanged
      agHelper.SelectDropDown("Red");
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.AssertContains("Option changed!", "be.visible", locators._modal);
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
      );

      //List - onItemClick
      agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.LIST_V2));
      agHelper.AssertContains(
        "List Item Clicked!",
        "be.visible",
        locators._modal,
      );
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
      );

      //Table - onSearchTextChanged
      table.SearchTable("test");
      agHelper.AssertContains(
        "Table search value changed!",
        "be.visible",
        locators._modal,
      );
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
      );

      //JSON Form - onSubmit
      agHelper.TypeText(locators._jsonFormInputField("name"), "test user");
      agHelper.TypeText(
        locators._jsonFormInputField("date_of_birth"),
        "12/03/1999",
      );
      agHelper.TypeText(locators._jsonFormInputField("employee_id"), "1234");
      agHelper.ClickButton("Submit", 1);
      agHelper.AssertContains("Form submitted!", "be.visible", locators._modal);
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
      );
    });

    it("6. Verify modal widget styles", function () {
      //JS conversion
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);
      propPane.MoveToTab("Style");
      propPane.EnterJSContext("Background color", "#fca5a5");
      propPane.EnterJSContext("Border radius", "1.5rem");
      agHelper
        .GetWidgetCSSFrAttribute(locators._modalWrapper, "background")
        .then((backgroundColor) => {
          deployMode.DeployApp(
            locators._widgetInDeployed(draggableWidgets.BUTTON),
          );
          agHelper.ClickButton("Submit");
          agHelper.AssertCSS(
            locators._modalWrapper,
            "background",
            backgroundColor,
          );
        });
      agHelper.AssertCSS(locators._modalWrapper, "border-radius", "24px");

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);
      propPane.MoveToTab("Style");
      //Full color picker
      propPane.ToggleJSMode("Background color", false);
      propPane.TogglePropertyState("Full color picker", "On");
      agHelper.GetNClick(
        propPane._propertyControlColorPicker("backgroundcolor"),
      );
      agHelper
        .GetWidgetCSSFrAttribute(locators._modalWrapper, "background")
        .then((backgroundColor) => {
          deployMode.DeployApp(
            locators._widgetInDeployed(draggableWidgets.BUTTON),
          );
          agHelper.ClickButton("Submit");
          agHelper.AssertCSS(
            locators._modalWrapper,
            "background",
            backgroundColor,
          );
        });
    });
  },
);
