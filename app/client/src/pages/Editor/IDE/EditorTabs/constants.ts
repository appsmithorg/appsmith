import type { EntityItem } from "@appsmith/entities/IDE/constants";
import { EditorEntityTab } from "@appsmith/entities/IDE/constants";
import type { AppState } from "@appsmith/reducers";
import {
  selectJSSegmentEditorTabs,
  selectQuerySegmentEditorTabs,
} from "@appsmith/selectors/appIDESelectors";
import {
  getJSSegmentItems,
  getQuerySegmentItems,
} from "@appsmith/selectors/entitiesSelector";
import { getJSEntityItemUrl } from "@appsmith/pages/Editor/IDE/EditorPane/JS/utils";
import { getQueryEntityItemUrl } from "@appsmith/pages/Editor/IDE/EditorPane/Query/utils";

export const TabSelectors: Record<
  EditorEntityTab,
  {
    tabsSelector: (state: AppState) => EntityItem[];
    listSelector: (state: AppState) => EntityItem[];
    itemUrlSelector: (item: EntityItem, pageId: string) => string;
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
