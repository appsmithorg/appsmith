import React from "react";
import { QueryEntityItem } from "pages/Editor/IDE/EditorPane/Query/EntityItem/QueryEntityItem";
import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";

export const ActionEntityItem = (props: { item: EntityItem }) => {
  return <QueryEntityItem {...props} />;
};
