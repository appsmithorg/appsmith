import { useDispatch, useSelector } from "react-redux";
import { toggleInstaller } from "actions/JSLibraryActions";
import { previewModeSelector } from "selectors/editorSelectors";
import { setGlobalSearchCategory } from "actions/globalSearchActions";
import { openAppSettingsPaneAction } from "actions/appSettingsPaneActions";
import { filterCategories } from "components/editorComponents/GlobalSearch/utils";
import { SEARCH_CATEGORY_ID } from "components/editorComponents/GlobalSearch/utils";

export const useHotKeysConfig = () => {
  const dispatch = useDispatch();
  const isPreviewMode = useSelector(previewModeSelector);

  /**
   * toggle omnibar with a category
   * category can be init, page, api, query, action, datasource, widget, js
   *
   * @param e
   * @param categoryID
   * @returns
   */
  const toggleOmnibar = (categoryID: SEARCH_CATEGORY_ID) => {
    if (isPreviewMode) return;

    const category = filterCategories[categoryID];

    dispatch(setGlobalSearchCategory(category));
    dispatch(toggleInstaller(false));
  };

  return [
    {
      id: "TOGGLE_OMNIBAR",
      label: "Toggle omnibar",
      hotkey: "mod + K",
      action: () => {
        toggleOmnibar(SEARCH_CATEGORY_ID.INIT);
      },
    },
    {
      id: "TOGGLE_OMNIBAR_PAGE",
      label: "Toggle app settings",
      hotkey: "mod + ,",
      action: () => {
        dispatch(openAppSettingsPaneAction());
      },
    },
  ];
};
