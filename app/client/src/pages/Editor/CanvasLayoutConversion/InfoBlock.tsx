import { Colors } from "constants/Colors";
import { Icon, IconSize, Text, TextType } from "design-system-old";
import React from "react";

export type InfoBlockProps = {
  icon: string;
  header: string;
  info: string;
};

export const InfoBlock = (props: InfoBlockProps) => {
  return (
    <div className="flex flex-row gap-2 py-2">
      <Icon
        fillColor={Colors.PRIMARY_ORANGE}
        name={props.icon}
        size={IconSize.XXXXL}
        withWrapper
        wrapperColor={Colors.PRIMARY_ORANGE_OPAQUE}
      />
      <div className="flex flex-col">
        <Text className="pb-1" type={TextType.H4}>
          {props.header}
        </Text>
        <Text type={TextType.P1}>{props.info}</Text>
      </div>
    </div>
  );
};
