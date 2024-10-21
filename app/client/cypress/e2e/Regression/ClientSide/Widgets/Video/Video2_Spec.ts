import {
  agHelper,
  draggableWidgets,
  deployMode,
  entityExplorer,
  homePage,
  locators,
  propPane,
  theme,
  widgetLocators,
} from "../../../../../support/Objects/ObjectsCore";
import testdata from "../../../../../fixtures/testdata.json";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Video widget tests",
  { tags: ["@tag.Widget", "@tag.Video", "@tag.Binding"] },
  function () {
    before(() => {
      homePage.NavigateToHome();
      //Contains video widget expanded to specific size such that all the buttons in it are visible & camera widget(video)
      homePage.ImportApp("videoWidgetApp.json");
    });

    it("1. Verify Basic Functionality of Video Widget - paused, ended", function () {
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.VIDEO));
      //Play , Pause & Resume Video
      agHelper.GetElement(widgetLocators.video).then(($video) => {
        $video[0].play();
        //Validate video parsed on clicking play
        const attrValue = $video[0].webkitVideoDecodedByteCount;
        expect(attrValue).be.greaterThan(30000);
      });
      agHelper.AssertProperty(widgetLocators.video, "paused", false);
      agHelper.AssertProperty(widgetLocators.video, "ended", false);
      agHelper.GetElement(widgetLocators.video).then(($video) => {
        $video[0].pause();
      });
      agHelper.AssertProperty(widgetLocators.video, "paused", true);
      //Change playback speed & seek
      agHelper.GetElement(widgetLocators.video).then(($video) => {
        $video[0].playbackRate = 4;
        $video[0].play();
      });
      //Wait for video to end
      agHelper.Sleep(5000);
      agHelper.AssertProperty(widgetLocators.video, "ended", true);
    });

    it("2. Verify widget for invalid URL's", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Video1", EntityType.Widget);
      propPane.RemoveText("URL");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.VIDEO));
      agHelper.AssertContains("Please provide a valid url");
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed(draggableWidgets.VIDEO) +
          " " +
          widgetLocators.video,
      );

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Video1", EntityType.Widget);
      //Check for Non-video url
      propPane.TypeTextIntoField(
        "URL",
        "http://host.docker.internal:4200/453-200x300.jpg/",
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.VIDEO));
      agHelper.GetElement(widgetLocators.video).then(($video) => {
        $video[0].play();
        const videoValue = $video[0].webkitVideoDecodedByteCount;
        const audioValue = $video[0].webkitAudioDecodedByteCount;
        expect($video[0].videoHeight).be.equal(0);
        expect($video[0].videoWidth).be.equal(0);
        expect(videoValue).be.equal(0);
        expect(audioValue).be.equal(0);
      });
    });

    it("3. Verify auto play property", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Video1", EntityType.Widget);
      agHelper.AssertExistingToggleState("Autoplay", "false");
      propPane.TypeTextIntoField("URL", testdata.videoUrl2);
      propPane.EnterJSContext("Autoplay", "{{(45>55)?false:true}}", true, true);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.VIDEO));
      agHelper.AssertProperty(widgetLocators.video, "paused", false);
      agHelper.GetElement(widgetLocators.video).then(($video) => {
        const attrValue = $video[0].webkitVideoDecodedByteCount;
        expect(attrValue).be.greaterThan(30000);
      });
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Video1", EntityType.Widget);
      propPane.EnterJSContext("Autoplay", "", false);
      propPane.ToggleJSMode("Autoplay", false);
      propPane.TogglePropertyState("Autoplay", "Off");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.VIDEO));
      agHelper.AssertProperty(widgetLocators.video, "paused", true);
    });

    it("4. Verify visible property", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Video1", EntityType.Widget);
      agHelper.AssertExistingToggleState("Visible", "true");
      propPane.EnterJSContext("Visible", "{{(55>45)?false:true}}", true, true);
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed(
          locators._widgetInDeployed(draggableWidgets.VIDEO) +
            " " +
            widgetLocators.video,
        ),
      );
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Video1", EntityType.Widget);
      propPane.EnterJSContext("Visible", "", false);
      propPane.ToggleJSMode("Visible", false);
      propPane.TogglePropertyState("Visible", "On");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.VIDEO));
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.VIDEO) +
          " " +
          widgetLocators.video,
      );
    });

    it("5. Verify OnPlay, OnPause, OnEnd events are JS convertible", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Video1", EntityType.Widget);
      propPane.EnterJSContext(
        "onPlay",
        "{{showAlert('Video is playing!')}}",
        true,
        true,
      );
      propPane.EnterJSContext(
        "onPause",
        "{{showAlert('Video paused!')}}",
        true,
        true,
      );
      propPane.EnterJSContext(
        "onEnd",
        "{{showAlert('Video ended!')}}",
        true,
        true,
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.VIDEO));
      agHelper.GetElement(widgetLocators.video).then(($video) => {
        $video[0].play();
        agHelper.ValidateToastMessage("Video is playing!");
        agHelper.Sleep(3000);
      });
      agHelper.GetElement(widgetLocators.video).then(($video) => {
        $video[0].pause();
        agHelper.ValidateToastMessage("Video paused!");
      });
      agHelper.GetElement(widgetLocators.video).then(($video) => {
        $video[0].play();
        //Wait for video to end
        agHelper.Sleep(5000);
        agHelper.ValidateToastMessage("Video ended!");
      });
    });

    it("6. Verify video styles", function () {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Video1", EntityType.Widget);
      propPane.MoveToTab("Style");
      propPane.SelectColorFromColorPicker("backgroundcolor", 9);
      agHelper.ContainsNClick("Medium");
      propPane.EnterJSContext("Border radius", "1.5rem");
      agHelper
        .GetWidgetCSSFrAttribute(widgetLocators.video, "background-color")
        .then((backgroundcolor) => {
          deployMode.DeployApp(
            locators._widgetInDeployed(draggableWidgets.VIDEO),
          );
          agHelper.AssertCSS(
            widgetLocators.video,
            "background-color",
            backgroundcolor,
          );
        });
      agHelper.AssertCSS(
        widgetLocators.video,
        "box-shadow",
        "rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px",
      );
      agHelper.AssertCSS(widgetLocators.video, "border-radius", "24px");
    });

    //Skipping below test due to issue - https://github.com/appsmithorg/appsmith/issues/26166
    // it("8. Verify Camera Binding", function () {
    //   deployMode.NavigateBacktoEditor();
    // EditorNavigation.SelectEntityByName("Camera1", EntityType.Widget);
    //   propPane.AssertPropertiesDropDownCurrentValue(
    //     "Default mobile camera",
    //     "Back (Rear)",
    //   );
    // EditorNavigation.SelectEntityByName("Video1", EntityType.Widget);
    //   propPane.TypeTextIntoField("URL", "{{Camera1.videoBlobURL}}");
    //   propPane.TogglePropertyState("Autoplay", "On");
    //   agHelper.AssertExistingToggleState("Visible", "true");
    //   deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.VIDEO));
    //   agHelper.AssertElementVisibility(
    //     locators._widgetInDeployed(draggableWidgets.VIDEO) +
    //       " " +
    //       widgetLocators.video,
    //   );
    //   agHelper.AssertProperty(widgetLocators.video, "paused", false);
    //   agHelper.ValidateToastMessage("Video is playing!");
    //   agHelper.GetElement(widgetLocators.video).then(($video) => {
    //     $video[0].pause();
    //     agHelper.ValidateToastMessage("Video paused!");
    //   });

    //   deployMode.NavigateBacktoEditor();
    // EditorNavigation.SelectEntityByName("Camera1", EntityType.Widget);
    //   propPane.SelectPropertiesDropDown(
    //     "Default mobile camera",
    //     "Front (Selfie)",
    //   );
    // EditorNavigation.SelectEntityByName("Video1", EntityType.Widget);
    //   propPane.TogglePropertyState("Autoplay", "On");
    //   agHelper.AssertExistingToggleState("Visible", "true");
    //   deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.VIDEO));
    //   agHelper.AssertElementVisibility(
    //     locators._widgetInDeployed(draggableWidgets.VIDEO) +
    //       " " +
    //       widgetLocators.video,
    //   );
    //   agHelper.AssertProperty(widgetLocators.video, "paused", false);
    //   agHelper.ValidateToastMessage("Video is playing!");
    //   agHelper.GetElement(widgetLocators.video).then(($video) => {
    //     $video[0].pause();
    //     agHelper.ValidateToastMessage("Video paused!");
    //   });
    // });
  },
);
