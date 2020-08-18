import React from "react";
import { boolean, select, text, withKnobs } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import AdsEditableText, { EditInteractionKind } from "../ads/EditableText";
import { action } from "@storybook/addon-actions";

export default {
  title: "EditableText",
  component: AdsEditableText,
  decorators: [withKnobs, withDesign],
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
      isInvalid={name => {
        if (name === "") {
          return "Name cannot be empty";
        } else {
          return false;
        }
      }}
      isEditingDefault={boolean("isEditingDefault", false)}
    ></AdsEditableText>
  </div>
);
