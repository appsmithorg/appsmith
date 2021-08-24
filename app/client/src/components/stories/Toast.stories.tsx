import React from "react";
import {
  Toaster,
  StyledToastContainer,
  ToastProps,
} from "components/ads/Toast";
import Button, { Size, Category } from "components/ads/Button";
import { action } from "@storybook/addon-actions";
import { Slide } from "react-toastify";
import { StoryWrapper, Variant } from "components/ads/common";
import { withDesign } from "storybook-addon-designs";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.toast.PATH,
  component: Text,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.BETA,
    },
  },
};

export function ToastStory(args: ToastProps) {
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
          action("button-clicked");
          Toaster.show(args);
        }}
        size={Size.large}
        text="Show toast message"
        variant={Variant.info}
      />
    </StoryWrapper>
  );
}

ToastStory.args = {
  text: "Archived successfully",
  variant: Variant.success,
  duration: 5000,
  showDebugButton: false,
  hideProgressBar: false,
};

ToastStory.argTypes = {
  variant: {
    control: controlType.SELECT,
    options: Object.values(Variant),
  },
  duration: { control: controlType.NUMBER },
  showDebugButton: { control: controlType.BOOLEAN },
  text: { control: controlType.TEXT },
  hideProgressBar: { control: controlType.BOOLEAN },
};

ToastStory.storyName = storyName.platform.toast.NAME;

// export function ToastStory() {
//   useEffect(() => {
//     Toaster.show({
//       text: text("message", "Archived successfully"),
//       duration: number("duration", 5000),
//       variant: select("variant", Object.values(Variant), Variant.info),
//       onUndo: action("on-undo"),
//     });
//   }, []);

//   return (
//     <StoryWrapper>
//       <StyledToastContainer
//         autoClose={5000}
//         closeButton={false}
//         draggable={false}
//         hideProgressBar
//         pauseOnHover={false}
//         transition={Slide}
//       />
//       <Button
//         category={Category.tertiary}
//         onClick={() => {
//           Toaster.show({
//             text: text("message", "Application name saved successfully"),
//             duration: number("duration", 5000),
//             variant: select("variant", Object.values(Variant), Variant.success),
//             onUndo: action("on-undo"),
//           });
//         }}
//         size={Size.large}
//         text="Show toast message"
//         variant={Variant.info}
//       />
//     </StoryWrapper>
//   );
// }
