import React from "react";
import { Icon, Text } from "@appsmith/ads";

export interface InfoBlockProps {
  icon: string;
  header: string;
  info: string;
}

export const InfoBlock = (props: InfoBlockProps) => {
  return (
    <div className="flex flex-row items-start gap-3 pt-3">
      <Icon color="var(--ads-v2-color-gray-600)" name={props.icon} size="lg" />
      <div>
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
