import React, { type Ref } from "react";
import { Text } from "@appsmith/wds";
import type { ExtraProps } from "react-markdown";

type ParagraphProps = React.ClassAttributes<HTMLDivElement> &
  React.HTMLAttributes<HTMLDivElement> &
  ExtraProps;

export const p = (props: ParagraphProps) => {
  const { children, ref } = props;

  return (
    <Text
      color="neutral"
      data-component="p"
      ref={ref as Ref<HTMLDivElement>}
      size="body"
    >
      {children}
    </Text>
  );
};
