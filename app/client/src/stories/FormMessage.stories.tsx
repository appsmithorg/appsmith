import React from "react";
import FormMessage, {
  MessageAction,
  ActionsContainer,
  ActionButton,
} from "components/editorComponents/form/FormMessage";
import { withKnobs, text, select } from "@storybook/addon-knobs";
import Centered from "components/designSystems/appsmith/CenteredWrapper";
import { withDesign } from "storybook-addon-designs";
import { IntentColors } from "constants/DefaultTheme";
import _ from "lodash";

export default {
  title: "Form Message",
  component: FormMessage,
  decorators: [withKnobs, withDesign],
};

const Intents = Object.keys(IntentColors);
const actions: MessageAction[] = [
  {
    url: "#",
    onClick: _.noop,
    text: "Action",
    intent: "primary",
  },
];
export const withDynamicProps = () => (
  <Centered style={{ height: "100vh" }}>
    <div
      style={{
        width: "500px",
        background: "white",
        height: "300px",
        padding: "20px",
      }}
    >
      <FormMessage
        intent={select("Form Message Intent", Intents, "primary")}
        message={text(
          "Form Message",
          "This is a sufficiently large placeholder message. Most messages will be this long",
        )}
        actions={actions}
      />
      <ActionsContainer>
        <ActionButton
          url={text("Action Button URL", "https://app.appsmith.com/")}
          text={text("Action Button Text", "Action Button")}
          intent={select("Action Button Intent", Intents, "primary")}
        />
      </ActionsContainer>
    </div>
  </Centered>
);

withDynamicProps.story = {
  name: "Dynamic Props",
  parameters: {
    design: {
      type: "figma",
      url: "",
    },
  },
};
