import React from "react";
import type { EntityItem } from "ee/entities/IDE/constants";
import { JSEntityItem } from "pages/Editor/IDE/EditorPane/JS/ListItem/JSEntityItem";

export const JSEntity = (props: { item: EntityItem }) => {
  return <JSEntityItem {...props} />;
};
