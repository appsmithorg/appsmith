import React from "react";
import type { EntityItem } from "ee/entities/IDE/constants";
import { JSEntityItem } from "pages/AppIDE/EditorPane/JS/EntityItem/JSEntityItem";

export const JSEntity = (props: { item: EntityItem }) => {
  return <JSEntityItem {...props} />;
};
