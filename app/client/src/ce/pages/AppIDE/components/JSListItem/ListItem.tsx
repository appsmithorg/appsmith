import React from "react";
import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";
import { JSEntityItem } from "pages/AppIDE/components/JSEntityItem";

export const JSEntity = (props: { item: EntityItem }) => {
  return <JSEntityItem {...props} />;
};
