import React from "react";
import { QueryEntity } from "pages/Editor/IDE/EditorPane/Query/ActionEntity/QueryEntity";
import type { EntityItem } from "ee/entities/IDE/constants";

export const ActionEntity = (props: {
  parentEntityId: string;
  item: EntityItem;
}) => {
  return <QueryEntity {...props} />;
};
