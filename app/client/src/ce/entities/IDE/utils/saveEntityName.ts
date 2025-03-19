import { saveActionName } from "actions/pluginActionActions";
import { EditorEntityTab } from "IDE/Interfaces/EditorTypes";
import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";
import { saveJSObjectName } from "actions/jsActionActions";

interface SaveEntityName {
  params: {
    name: string;
    id: string;
  };
  segment: EditorEntityTab;
  entity?: EntityItem;
}

export const saveEntityName = ({ params, segment }: SaveEntityName) => {
  let saveNameAction = saveActionName(params);

  if (EditorEntityTab.JS === segment) {
    saveNameAction = saveJSObjectName(params);
  }

  return saveNameAction;
};
