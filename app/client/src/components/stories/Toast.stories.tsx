import React, { useEffect } from "react";
import { withKnobs, text, number, select } from "@storybook/addon-knobs";
import { Toaster, StyledToastContainer } from "components/ads/Toast";
import Button, { Size, Category } from "components/ads/Button";
import { action } from "@storybook/addon-actions";
import { Slide } from "react-toastify";
import { StoryWrapper, Variant } from "components/ads/common";

export default {
  title: "Toast",
  component: Toaster,
  decorators: [withKnobs],
};

export function ToastStory() {
  useEffect(() => {
    Toaster.show({
      text: text("message", "Archived successfully"),
      duration: number("duration", 5000),
      variant: select("variant", Object.values(Variant), Variant.info),
      onUndo: action("on-undo"),
    });
  }, []);

  return (
    <StoryWrapper>
      <StyledToastContainer
        autoClose={5000}
        closeButton={false}
        draggable={false}
        hideProgressBar
        pauseOnHover={false}
        transition={Slide}
      />
      <Button
        category={Category.tertiary}
        onClick={() => {
          Toaster.show({
            text: text("message", "Application name saved successfully"),
            duration: number("duration", 5000),
            variant: select("variant", Object.values(Variant), Variant.success),
            onUndo: action("on-undo"),
          });
        }}
        size={Size.large}
        text="Show toast message"
        variant={Variant.info}
      />
    </StoryWrapper>
  );
}
