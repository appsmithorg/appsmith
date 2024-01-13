import { getWidgetSelector } from "../../../../locators/WidgetLocators";
import {
  agHelper,
  entityExplorer,
  propPane,
  autoLayout,
  draggableWidgets,
  deployMode,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const largeText =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Netus et malesuada fames ac turpis egestas integer. Convallis tellus id interdum velit laoreet id donec. Sit amet mattis vulputate enim nulla. Dignissim suspendisse in est ante in. Ac orci phasellus egestas tellus rutrum tellus pellentesque eu. Urna duis convallis convallis tellus id. Tempus urna et pharetra pharetra massa massa ultricies. Netus et malesuada fames ac turpis. Lorem dolor sed viverra ipsum nunc. Ut tristique et egestas quis. Ut diam quam nulla porttitor massa id neque. Vestibulum lectus mauris ultrices eros in cursus turpis massa. Purus in massa tempor nec feugiat nisl pretium. Integer malesuada nunc vel risus commodo viverra maecenas accumsan. In arcu cursus euismod quis viverra nibh cras pulvinar mattis. Eu consequat ac felis donec et odio pellentesque diam. Feugiat sed lectus vestibulum mattis ullamcorper velit. Phasellus faucibus scelerisque eleifend donec. Ut porttitor leo a diam sollicitudin tempor id. Amet consectetur adipiscing elit pellentesque habitant morbi tristique senectus. Ut porttitor leo a diam sollicitudin. Et magnis dis parturient montes nascetur ridiculus. Risus ultricies tristique nulla aliquet enim tortor at auctor. Ultricies tristique nulla aliquet enim tortor at auctor urna. Neque ornare aenean euismod elementum nisi quis eleifend. Amet risus nullam eget felis. Turpis egestas integer eget aliquet nibh praesent tristique magna. Velit sed ullamcorper morbi tincidunt. Dignissim cras tincidunt lobortis feugiat vivamus at augue";

describe(
  "Validating use cases for Auto Dimension",
  { tags: ["@tag.MobileResponsive"] },
  () => {
    before(() => {
      autoLayout.ConvertToAutoLayoutAndVerify(false);
      agHelper.Sleep(2000);
      agHelper.AddDsl("autoLayoutAutoHeight");
    });

    it("1. Should increase the height of the text widget when text is added", () => {
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);

      propPane.TypeTextIntoField("Default Value", "This is a test");
      agHelper.ClickButton("Submit");
      agHelper
        .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.TEXT))
        .then((height) => {
          const textHeight = parseInt(height?.split("px")[0]);
          expect(textHeight).to.eq(36);
        });

      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      propPane.TypeTextIntoField("Default Value", largeText);
      agHelper.ClickButton("Submit");
      agHelper
        .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.TEXT))
        .then((height) => {
          const textHeight = parseInt(height?.split("px")[0]);
          expect(textHeight).to.greaterThan(300);
        });

      deployMode.DeployApp();

      agHelper.GetNClick(locators._textAreainputWidgetv2InDeployed);
      agHelper.ClearNType(
        locators._textAreainputWidgetv2InDeployed,
        "This is a test",
      );

      agHelper.ClickButton("Submit");
      agHelper
        .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.TEXT))
        .then((height) => {
          const textHeight = parseInt(height?.split("px")[0]);
          expect(textHeight).to.eq(32);
        });

      cy.get(locators._textAreainputWidgetv2InDeployed).type(largeText);
      agHelper.ClickButton("Submit");
      agHelper
        .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.TEXT))
        .then((height) => {
          const textHeight = parseInt(height?.split("px")[0]);
          expect(textHeight).to.greaterThan(170);
        });
    });
  },
);
