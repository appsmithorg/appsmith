import React from "react";
import { Icon as BIcon } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";

export type IconType = IconName | string;

type IconProps = {
  className?: string;
  name?: IconType;
  color?: string;
};

const Icon = (props: IconProps) => {
  const { name, ...rest } = props;

  if (!name) return null;

  return <BIcon icon={name as IconName} {...rest} />;
};

export default Icon;
