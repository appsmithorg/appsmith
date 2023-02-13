export const transformV1ButtonProps = (v1Props: any) => {
  const { buttonColor, buttonVariant, text, widgetName, ...rest } = v1Props;

  const transformedProps: any = { ...rest };

  switch (buttonVariant) {
    case "PRIMARY":
      transformedProps.variant = "filled";
      break;
    case "SECONDARY":
      transformedProps.variant = "outline";
      break;
    case "TERTIARY":
      transformedProps.variant = "subtle";
      break;
  }

  transformedProps.children = text;
  transformedProps.accentColor = buttonColor;

  return {
    ...transformedProps,
    widgetName: widgetName || "Button",
  };
};
