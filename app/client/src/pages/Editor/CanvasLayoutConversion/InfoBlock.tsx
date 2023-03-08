import { Colors } from "constants/Colors";
import { Icon, IconSize } from "design-system-old";
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
        <h2 className="text-base font-medium pb-1">{props.header}</h2>
        <p className="text-sm font-normal">{props.info}</p>
      </div>
    </div>
  );
};
