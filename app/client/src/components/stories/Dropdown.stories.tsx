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

export const Text = () => (
  <StoryWrapper>
    <Dropdown
      options={[
        {
          id: "111abc",
          value: text("1st Option", "First option"),
        },
        {
          id: "222abc",
          value: text("2nd Option", "Second option"),
        },
        {
          id: "322abc",
          value: text("3rd Option", "Third option"),
        },
      ]}
      selected={{
        id: select("Selected id", ["111abc", "222abc", "333abc"], "111abc"),
        value: text("Selected value", "First option"),
      }}
      disabled={boolean("disabled", false)}
    ></Dropdown>
  </StoryWrapper>
);

export const IconAndText = () => (
  <StoryWrapper>
    <Dropdown
      options={[
        {
          id: "111abc",
          value: text("1st Option", "Delete"),
          icon: select("1st Icon", IconCollection, "delete"),
        },
        {
          id: "222abc",
          value: text("2nd Option", "User"),
          icon: select("2nd Icon", IconCollection, "user"),
        },
        {
          id: "322abc",
          value: text("3rd Option", "General"),
          icon: select("3rd Icon", IconCollection, "general"),
        },
      ]}
      selected={{
        id: select("Selected id", ["111abc", "222abc", "333abc"], "111abc"),
        value: text("Selected value", "Delete"),
      }}
      disabled={boolean("disabled", false)}
    ></Dropdown>
  </StoryWrapper>
);

export const LabelAndText = () => (
  <StoryWrapper>
    <Dropdown
      options={[
        {
          id: "111abc",
          value: text("1st Option", "Admin"),
          label: text(
            "1st label",
            "Can edit, view and invite other user to an app",
          ),
        },
        {
          id: "222abc",
          value: text("2nd Option", "Developer"),
          label: text("2nd label", "Can view and invite other user to an app"),
        },
        {
          id: "322abc",
          value: text("3rd Option", "User"),
          label: text(
            "3rd label",
            "Can view and invite other user to an app and…",
          ),
        },
      ]}
      selected={{
        id: select("Selected id", ["111abc", "222abc", "333abc"], "111abc"),
        value: text("Selected value", "Developer"),
      }}
      disabled={boolean("disabled", false)}
    ></Dropdown>
  </StoryWrapper>
);
