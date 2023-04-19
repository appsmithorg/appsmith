import React from "react";
import { Icon, Text } from "design-system";

export type InfoBlockProps = {
  icon: string;
  header: string;
  info: string;
};

export const InfoBlock = (props: InfoBlockProps) => {
  return (
    <div className="flex flex-row align-top gap-2 pt-3">
      <Icon color="var(--ads-v2-color-fg-brand)" name={props.icon} size="lg" />

      <div className="flex flex-col">
        <Text className="pb-1" kind="heading-s" renderAs="h4">
          {props.header}
        </Text>
        <Text kind="body-m" renderAs="p">
          {props.info}
        </Text>
      </div>
    </div>
  );
};
