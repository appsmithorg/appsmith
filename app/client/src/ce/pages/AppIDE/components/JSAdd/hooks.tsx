import { createNewJSCollection } from "actions/jsPaneActions";
import type { GroupedAddOperations } from "IDE/Interfaces/GroupedAddOperations";
import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";
import { JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";

export const useGroupedAddJsOperations = (): GroupedAddOperations => {
  return [
    {
      className: "t--blank-js",
      operations: [
        {
          title: createMessage(EDITOR_PANE_TEXTS.js_blank_object_item),
          desc: "",
          icon: JsFileIconV2(16, 16),
          kind: SEARCH_ITEM_TYPES.actionOperation,
          action: (pageId) => createNewJSCollection(pageId, "ENTITY_EXPLORER"),
        },
      ],
    },
  ];
};
