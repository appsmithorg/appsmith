import React, { useEffect } from "react";
import {
  withKnobs,
  text,
  number,
  select,
  boolean,
} from "@storybook/addon-knobs";
import { Toaster, StyledToastContainer } from "components/ads/Toast";
import Button, { Variant, Size, Category } from "components/ads/Button";
import { action } from "@storybook/addon-actions";
import { StoryWrapper } from "./Tabs.stories";
import { Slide } from "react-toastify";

export default {
  title: "Toast",
  component: Toaster,
  decorators: [withKnobs],
};

export const ToastStory = () => {
  useEffect(() => {
    Toaster.show({
      text: text("message", "Archived successfully"),
      duration: number("duration", 5000),
      variant: select(
        "variant",
        [Variant.info, Variant.success, Variant.danger, Variant.warning],
        Variant.info,
      ),
      pauseOnHover: boolean("pauseOnHover", false),
      onUndo: action("on-undo"),
    });
  }, []);

  return (
    <StoryWrapper>
      <StyledToastContainer
        hideProgressBar
        draggable={false}
        transition={Slide}
        autoClose={5000}
        closeButton={false}
        pauseOnHover={false}
      />
      <Button
        size={Size.medium}
        category={Category.tertiary}
        variant={Variant.info}
        text="Show toast message"
        onClick={() => {
          Toaster.show({
            text: text("message", "App name saved successfully"),
            duration: number("duration", 5000),
            variant: select(
              "variant",
              [Variant.info, Variant.success, Variant.danger, Variant.warning],
              Variant.success,
            ),
            onUndo: action("on-undo"),
            pauseOnHover: boolean("pauseOnHover", false),
          });
        }}
      />
    </StoryWrapper>
  );
};
