import React, { useState } from "react";
import { boolean, select, text, withKnobs } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import EditableText, {
  EditInteractionKind,
  SavingState,
} from "components/ads/EditableText";
import { action } from "@storybook/addon-actions";
import { StoryWrapper } from "components/ads/common";

export default {
  title: "EditableText",
  component: EditableText,
  decorators: [withKnobs, withDesign],
};

const errorFunction = (name: string) => {
  if (name === "") {
    return "Name cannot be empty";
  } else {
    return false;
  }
};

export const EditableTextStory = () => {
  const [savingState, SetSavingState] = useState<SavingState>(
    SavingState.NOT_STARTED,
  );

  return (
    <StoryWrapper>
      <EditableText
        defaultValue={text("defaultValue", "Product design app")}
        editInteractionKind={select(
          "editInteractionKind",
          Object.values(EditInteractionKind),
          EditInteractionKind.SINGLE,
        )}
        onTextChanged={action("text-changed")}
        valueTransform={(value) => value.toUpperCase()}
        placeholder={text("placeholder", "Edit input")}
        hideEditIcon={boolean("hideEditIcon", false)}
        isInvalid={(name) => errorFunction(name)}
        isEditingDefault={boolean("isEditingDefault", false)}
        fill={boolean("fill", false)}
        savingState={savingState}
        onBlur={() => {
          SetSavingState(SavingState.STARTED);
          setTimeout(() => {
            SetSavingState(SavingState.SUCCESS);
          }, 2000);
        }}
      ></EditableText>
    </StoryWrapper>
  );
};
