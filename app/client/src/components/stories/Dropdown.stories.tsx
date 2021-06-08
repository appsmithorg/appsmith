import React from "react";
import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import Dropdown from "components/ads/Dropdown";
import { action } from "@storybook/addon-actions";
import { IconCollection } from "components/ads/Icon";
import { StoryWrapper } from "components/ads/common";

export default {
  title: "Dropdown",
  component: Dropdown,
  decorators: [withKnobs, withDesign],
};

export function Text() {
  return (
    <StoryWrapper>
      <Dropdown
        disabled={boolean("disabled", false)}
        onSelect={action("selected-option")}
        options={[
          {
            id: "111abc",
            value: text("1st Option", "First option"),
            onSelect: action("selected-option"),
          },
          {
            id: "222abc",
            value: text("2nd Option", "Second option"),
            onSelect: action("selected-option"),
          },
          {
            id: "322abc",
            value: text("3rd Option", "Third option"),
            onSelect: action("selected-option"),
          },
        ]}
        selected={{
          id: select("Selected id", ["111abc", "222abc", "333abc"], "111abc"),
          value: text("Selected value", "First option"),
        }}
      />
    </StoryWrapper>
  );
}

export function IconAndText() {
  return (
    <StoryWrapper>
      <Dropdown
        disabled={boolean("disabled", false)}
        onSelect={action("selected-option")}
        options={[
          {
            id: "111abc",
            value: text("1st Option", "Delete"),
            icon: select("1st Icon", IconCollection, "delete"),
            onSelect: action("selected-option"),
          },
          {
            id: "222abc",
            value: text("2nd Option", "User"),
            icon: select("2nd Icon", IconCollection, "user"),
            onSelect: action("selected-option"),
          },
          {
            id: "322abc",
            value: text("3rd Option", "General"),
            icon: select("3rd Icon", IconCollection, "general"),
            onSelect: action("selected-option"),
          },
        ]}
        selected={{
          id: select("Selected id", ["111abc", "222abc", "333abc"], "111abc"),
          value: text("Selected value", "Delete"),
        }}
      />
    </StoryWrapper>
  );
}

export function LabelAndText() {
  return (
    <StoryWrapper>
      <Dropdown
        disabled={boolean("disabled", false)}
        onSelect={action("selected-option")}
        options={[
          {
            id: "111abc",
            value: text("1st Option", "Admin"),
            label: text(
              "1st label",
              "Can edit, view and invite other user to an app",
            ),
            onSelect: action("selected-option"),
          },
          {
            id: "222abc",
            value: text("2nd Option", "Developer"),
            label: text(
              "2nd label",
              "Can view and invite other user to an app",
            ),
            onSelect: action("selected-option"),
          },
          {
            id: "322abc",
            value: text("3rd Option", "User"),
            label: text(
              "3rd label",
              "Can view and invite other user to an app and…",
            ),
            onSelect: action("selected-option"),
          },
        ]}
        selected={{
          id: select("Selected id", ["111abc", "222abc", "333abc"], "111abc"),
          value: text("Selected value", "Developer"),
        }}
      />
    </StoryWrapper>
  );
}
