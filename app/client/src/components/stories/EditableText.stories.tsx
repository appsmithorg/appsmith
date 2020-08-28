import React from "react";
import { boolean, select, text, withKnobs } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import EditableText, {
  EditInteractionKind,
  SavingStateHandler,
  SavingState,
} from "components/ads/EditableText";
import { action } from "@storybook/addon-actions";
import { StoryWrapper } from "./Tabs.stories";

export default {
  title: "EditableText",
  component: EditableText,
  decorators: [withKnobs, withDesign],
};

const calls = (value: string, callback: any) => {
  console.log("value", value);

  // setTimeout(() => {
  //   return callback(SavingState.ERROR);
  // }, 2000);

  setTimeout(() => {
    return callback(false, SavingState.SUCCESS);
  }, 2000);

  return callback(true);
};

const errorFunction = (name: string) => {
  if (name === "") {
    return "Name cannot be empty";
  } else {
    return false;
  }
};

export const EditableTextStory = () => (
  <StoryWrapper>
    <EditableText
      defaultValue={text("defaultValue", "Product design app")}
      editInteractionKind={select(
        "editInteractionKind",
        [EditInteractionKind.SINGLE, EditInteractionKind.DOUBLE],
        EditInteractionKind.SINGLE,
      )}
      onTextChanged={action("text-changed")}
      valueTransform={value => value.toUpperCase()}
      placeholder={text("placeholder", "Edit input")}
      hideEditIcon={boolean("hideEditIcon", false)}
      isInvalid={name => errorFunction(name)}
      isEditingDefault={boolean("isEditingDefault", false)}
      fill={boolean("fill", false)}
      onSubmit={(value: string, callback: SavingStateHandler) =>
        calls(value, callback)
      }
    ></EditableText>
  </StoryWrapper>
);
