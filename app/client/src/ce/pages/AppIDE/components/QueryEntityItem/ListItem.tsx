import React from "react";
import { QueryEntityItem } from "pages/AppIDE/components/QueryEntityItem";
import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";

export const ActionEntityItem = (props: { item: EntityItem }) => {
  return <QueryEntityItem {...props} />;
};
