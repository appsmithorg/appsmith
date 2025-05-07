import { EditorEntityTab } from "IDE/Interfaces/EditorTypes";
import type { DefaultRootState } from "react-redux";
import {
  selectJSSegmentEditorTabs,
  selectQuerySegmentEditorTabs,
} from "ee/selectors/appIDESelectors";
import {
  getJSSegmentItems,
  getQuerySegmentItems,
} from "ee/selectors/entitiesSelector";
import { getJSEntityItemUrl } from "ee/pages/AppIDE/layouts/routers/utils/getJSEntityItemUrl";
import { getQueryEntityItemUrl } from "ee/pages/AppIDE/layouts/routers/utils/getQueryEntityItemUrl";
import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";

export const TabSelectors: Record<
  EditorEntityTab,
  {
    tabsSelector: (state: DefaultRootState) => EntityItem[];
    listSelector: (state: DefaultRootState) => EntityItem[];
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
