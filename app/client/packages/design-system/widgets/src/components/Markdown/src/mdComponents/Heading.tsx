import React from "react";
import type { Ref } from "react";
import type { ExtraProps } from "react-markdown";
import { Text, type TextProps } from "@appsmith/wds";

type HeadingProps = React.ClassAttributes<HTMLDivElement> &
  React.HTMLAttributes<HTMLDivElement> &
  ExtraProps;

const createHeading = (
  size: TextProps["size"],
  level: 1 | 2 | 3 | 4 | 5 | 6,
  fontWeight: TextProps["fontWeight"] = 700,
) => {
  const HeadingComponent = ({ children, ref }: HeadingProps) => (
    <Text
      color="neutral"
      data-component={`h${level}`}
      fontWeight={fontWeight}
      ref={ref as Ref<HTMLDivElement>}
      size={size}
      wordBreak="break-word"
    >
      {children}
    </Text>
  );

  HeadingComponent.displayName = `Heading${level}`;

  return HeadingComponent;
};

export const h1 = createHeading("heading", 1);
export const h2 = createHeading("title", 2);
export const h3 = createHeading("subtitle", 3);
export const h4 = createHeading("body", 4);
export const h5 = createHeading("body", 5, 500);
export const h6 = createHeading("body", 6, 300);
