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
    <div className="flex flex-row gap-2 pt-3">
      <Icon
        clickable={false}
        fillColor={Colors.PRIMARY_ORANGE}
        name={props.icon}
        size={IconSize.XXXL}
        withWrapper
        wrapperColor={Colors.PRIMARY_ORANGE_OPAQUE}
      />
      <div className="flex flex-col">
        <Text className="pb-1" type={TextType.H4}>
          {props.header}
        </Text>
        <Text color={Colors.GRAY_500} type={TextType.P1} weight="400">
          {props.info}
        </Text>
      </div>
    </div>
  );
};
