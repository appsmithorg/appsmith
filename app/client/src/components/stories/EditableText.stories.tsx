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

export function EditableTextStory() {
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
        fill={boolean("fill", false)}
        hideEditIcon={boolean("hideEditIcon", false)}
        isEditingDefault={boolean("isEditingDefault", false)}
        isInvalid={(name) => errorFunction(name)}
        onBlur={() => {
          SetSavingState(SavingState.STARTED);
          setTimeout(() => {
            SetSavingState(SavingState.SUCCESS);
          }, 2000);
        }}
        onTextChanged={action("text-changed")}
        placeholder={text("placeholder", "Edit input")}
        savingState={savingState}
        valueTransform={(value) => value.toUpperCase()}
      />
    </StoryWrapper>
  );
}
