import type { EntityItem } from "ee/entities/IDE/constants";
import { EditorEntityTab } from "ee/entities/IDE/constants";
import type { AppState } from "ee/reducers";
import {
  selectJSSegmentEditorTabs,
  selectQuerySegmentEditorTabs,
} from "ee/selectors/appIDESelectors";
import {
  getJSSegmentItems,
  getQuerySegmentItems,
} from "ee/selectors/entitiesSelector";
import { getJSEntityItemUrl } from "ee/pages/Editor/IDE/EditorPane/JS/utils";
import { getQueryEntityItemUrl } from "ee/pages/Editor/IDE/EditorPane/Query/utils";

export const TabSelectors: Record<
  EditorEntityTab,
  {
    tabsSelector: (state: AppState) => EntityItem[];
    listSelector: (state: AppState) => EntityItem[];
    itemUrlSelector: (item: EntityItem, basePageId: string) => string;
  }
> = {
  [EditorEntityTab.JS]: {
    tabsSelector: selectJSSegmentEditorTabs,
    listSelector: getJSSegmentItems,
    itemUrlSelector: getJSEntityItemUrl,
  },
  [EditorEntityTab.QUERIES]: {
    tabsSelector: selectQuerySegmentEditorTabs,
    listSelector: getQuerySegmentItems,
    itemUrlSelector: getQueryEntityItemUrl,
  },
  // Currently we do not show any tabs in the UI segment
  [EditorEntityTab.UI]: {
    tabsSelector: () => [],
    listSelector: () => [],
    itemUrlSelector: () => "",
  },
};
