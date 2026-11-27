import {
  agHelper,
  draggableWidgets,
  deployMode,
  entityExplorer,
  locators,
  propPane,
  widgetLocators,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Image widget tests",
  { tags: ["@tag.Widget", "@tag.Image", "@tag.Binding"] },
  function () {
    const fixtureOrigin = "http://host.docker.internal:4200";
    const jpgImg = fixtureOrigin + "/453-200x300.jpg";
    const gifImg = fixtureOrigin + "/sampleGIFfile.gif";
    const svgImg = fixtureOrigin + "/kiwi.svg";
    const webpImg = fixtureOrigin + "/4_sm.webp";
    const pngImg = fixtureOrigin + "/clouddefaultImage.png";
    let editorUrl: string;

    const assertImageLoaded = (src: string) => {
      cy.get<HTMLImageElement>(widgetLocators.image + " img").should(
        ($image) => {
          expect($image).to.have.attr("src", src);
          expect($image[0].naturalWidth).to.be.greaterThan(0);
        },
      );
    };

    before(() => {
      cy.url().then((url) => {
        editorUrl = url;
      });
    });

    beforeEach(() => {
      cy.visit(editorUrl);
      agHelper.AddDsl("emptyDSL");
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.IMAGE);
      EditorNavigation.SelectEntityByName("Image1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Image", jpgImg);
    });

    it("1. Verify Image Preview for different types of images (png, jpg, gif, svg, webp)", function () {
      for (const src of [jpgImg, gifImg, webpImg, svgImg, pngImg]) {
        propPane.UpdatePropertyFieldValue("Image", src);
        assertImageLoaded(src);
        deployMode.DeployApp(
          locators._widgetInDeployed(draggableWidgets.IMAGE),
        );
        assertImageLoaded(src);
        agHelper.AssertContains("Unable to display the image", "not.exist");
        deployMode.NavigateBacktoEditor();
        EditorNavigation.SelectEntityByName("Image1", EntityType.Widget);
      }
    });

    it("2. Validate Binding Image to Button Widget and checking the behaviour on enabling/disabling the button", function () {
      propPane.UpdatePropertyFieldValue(
        "Image",
        "{{Button1.isDisabled ?'" + jpgImg + "':'" + gifImg + "'}}",
      );
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 200, 400);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.IMAGE));
      assertImageLoaded(gifImg);
      agHelper.AssertContains("Unable to display the image", "not.exist");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.TogglePropertyState("Disabled", "On");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.IMAGE));
      assertImageLoaded(jpgImg);
      agHelper.AssertContains("Unable to display the image", "not.exist");
    });

    it("3. Verify Zoom In property", function () {
      propPane.AssertPropertiesDropDownCurrentValue(
        "Max zoom level",
        "1x (No Zoom)",
      );
      propPane.AssertPropertiesDropDownValues("Max zoom level", [
        "1x (No Zoom)",
        "2x",
        "4x",
        "8x",
        "16x",
      ]);
      propPane.SelectPropertiesDropDown("Max zoom level", "16x");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper.AssertCSS(widgetLocators.image, "cursor", "zoom-in");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Image1", EntityType.Widget);
      propPane.EnterJSContext("Max zoom level", "{{(55>45)?1:16}}", true, true);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper
        .GetElement(widgetLocators.image)
        .should("not.have.css", "cursor", "zoom-in");
    });

    it("4. Verify Object fit property", function () {
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper.AssertCSS(widgetLocators.image, "background-size", "cover");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Image1", EntityType.Widget);
      propPane.AssertPropertiesDropDownCurrentValue("Object fit", "Cover");
      propPane.AssertPropertiesDropDownValues("Object fit", [
        "Contain",
        "Cover",
        "Auto",
      ]);
      propPane.SelectPropertiesDropDown("Object fit", "Contain");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper.AssertCSS(widgetLocators.image, "background-size", "contain");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Image1", EntityType.Widget);
      propPane.EnterJSContext(
        "Object fit",
        "{{(55>45)?auto:contain}}",
        true,
        true,
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper.AssertCSS(widgetLocators.image, "background-size", "auto");
    });

    it("5. Verify visible property is JS convertible", function () {
      propPane.EnterJSContext("Visible", "{{(55>45)?false:true}}", true, true);
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed(draggableWidgets.IMAGE),
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Image1", EntityType.Widget);
      propPane.EnterJSContext("Visible", "{{(45>55)?false:true}}", false, true);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.IMAGE));
    });

    it("6. Verify image styles", function () {
      propPane.MoveToTab("Style");
      propPane.EnterJSContext("Border radius", "", true, true);
      agHelper.AssertElementVisibility(widgetLocators.styleOrangeIcon);
      agHelper.AssertElementVisibility(widgetLocators.styleResetBtn);
      agHelper.GetNClick(widgetLocators.styleResetBtn);
      agHelper.AssertContains(
        "{{appsmith.theme.borderRadius.appBorderRadius}}",
        "be.visible",
      );
      propPane.ToggleJSMode("borderradius", false);
      agHelper.ContainsNClick("Medium");
      propPane.EnterJSContext("Border radius", "24px");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper.AssertCSS(
        locators._widgetInDeployed(draggableWidgets.IMAGE) +
          " > div > div > div",
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px",
      );
      agHelper.AssertCSS(
        locators._widgetInDeployed(draggableWidgets.IMAGE) +
          " > div > div > div",
        "border-radius",
        "24px",
      );
    });

    it("7. Validate OnClick Event", function () {
      propPane.EnterJSContext(
        "onClick",
        "{{showAlert('Image Clicked!','success')}}",
        true,
      );
      propPane.ToggleJSMode("onClick", false);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper.ValidateToastMessage("Image Clicked!");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Image1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Image Clicked again!",
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.IMAGE));
      agHelper.ValidateToastMessage("Image Clicked again!");
    });
  },
);
