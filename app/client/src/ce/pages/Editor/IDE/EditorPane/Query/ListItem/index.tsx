import React from "react";
import { QueryEntityItem } from "pages/Editor/IDE/EditorPane/Query/ListItem/QueryEntityItem";
import type { EntityItem } from "ee/entities/IDE/constants";

export const ActionEntityItem = (props: { item: EntityItem }) => {
  return <QueryEntityItem {...props} />;
};
