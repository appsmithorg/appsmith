import React from "react";
import { QueryEntityItem } from "pages/AppIDE/EditorPane/Query/EntityItem/QueryEntityItem";
import type { EntityItem } from "ee/entities/IDE/constants";

export const ActionEntityItem = (props: { item: EntityItem }) => {
  return <QueryEntityItem {...props} />;
};
