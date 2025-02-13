import { useParentEntityInfo } from "ee/IDE/hooks/useParentEntityInfo";
import { EditorEntityTab } from "../../../../../IDE/Interfaces/EditorTypes";
import history, { NavigationMethod } from "../../../../../utils/history";
import {
  jsCollectionListURL,
  queryListURL,
  widgetListURL,
} from "ee/RouteBuilder";
import { IDE_TYPE } from "ee/IDE/Interfaces/IDETypes";

export const useSegmentNavigation = (): {
  onSegmentChange: (value: string) => void;
} => {
  const { parentEntityId: baseParentEntityId } = useParentEntityInfo(
    IDE_TYPE.App,
  );

  /**
   * Callback to handle the segment change
   *
   * @param value
   * @returns
   *
   */
  const onSegmentChange = (value: string) => {
    switch (value) {
      case EditorEntityTab.QUERIES:
        history.push(queryListURL({ baseParentEntityId }), {
          invokedBy: NavigationMethod.SegmentControl,
        });
        break;
      case EditorEntityTab.JS:
        history.push(jsCollectionListURL({ baseParentEntityId }), {
          invokedBy: NavigationMethod.SegmentControl,
        });
        break;
      case EditorEntityTab.UI:
        history.push(widgetListURL({ baseParentEntityId }), {
          invokedBy: NavigationMethod.SegmentControl,
        });
        break;
    }
  };

  return { onSegmentChange };
};
