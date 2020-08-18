import React from "react";
import { boolean, select, text, withKnobs } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import AdsEditableText, {
  EditInteractionKind,
  SavingFunc,
  SavingState,
} from "../ads/EditableText";
import { action } from "@storybook/addon-actions";

export default {
  title: "EditableText",
  component: AdsEditableText,
  decorators: [withKnobs, withDesign],
};

const calls = (value: string, callback: any) => {
  console.log("value", value);

  // setTimeout(() => {
  //   return callback(SavingState.ERROR);
  // }, 2000);

  setTimeout(() => {
    return callback(SavingState.SUCCESS);
  }, 2000);

  return callback(SavingState.STARTED);
};

const errorFunction = (name: string) => {
  if (name === "") {
    return "Name cannot be empty";
  } else {
    return false;
  }
};

export const EditableTextStory = () => (
  <div style={{ padding: "50px" }}>
    <AdsEditableText
      defaultValue={text("defaultValue", "Product design app")}
      editInteractionKind={select(
        "editInteractionKind",
        [EditInteractionKind.SINGLE, EditInteractionKind.DOUBLE],
        EditInteractionKind.SINGLE,
      )}
      onTextChanged={action("text-changed")}
      valueTransform={value => value.toUpperCase()}
      placeholder={text("placeholder", "edit it")}
      hideEditIcon={boolean("hideEditIcon", false)}
      isInvalid={name => errorFunction(name)}
      isEditingDefault={boolean("isEditingDefault", false)}
      fill={boolean("fill", false)}
      apiCallback={(value: string, callback: SavingFunc) =>
        calls(value, callback)
      }
    ></AdsEditableText>
  </div>
);
