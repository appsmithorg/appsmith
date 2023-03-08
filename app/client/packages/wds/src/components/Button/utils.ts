import { ButtonVariant } from "./Button";

export const transformV1ButtonProps = (v1Props: any) => {
  const { buttonColor, buttonVariant, text } = v1Props;

  const transformedProps: any = {};

  switch (buttonVariant) {
    case "PRIMARY":
      transformedProps.variant = ButtonVariant.FILLED;
      break;
    case "SECONDARY":
      transformedProps.variant = ButtonVariant.OUTLINE;
      break;
    case "TERTIARY":
      transformedProps.variant = ButtonVariant.SUBTLE;
      break;
  }

  transformedProps.children = text;
  transformedProps.accentColor = buttonColor;

  return {
    ...v1Props,
    ...transformedProps,
  };
};
