import { isAirgapped } from "ee/utils/airgapHelpers";
import {
  ADD_PAGE_FROM_TEMPLATE,
  createMessage,
  GENERATE_PAGE_ACTION_TITLE,
} from "ee/constants/messages";
import {
  LayoutSystemFeatures,
  useLayoutSystemFeatures,
} from "layoutSystems/common/useLayoutSystemFeatures";
import { openGeneratePageModal } from "pages/Editor/GeneratePage/store/generatePageActions";
import { useDispatch } from "react-redux";
import { showTemplatesModal } from "actions/templateActions";
import { useMemo } from "react";

export const useGenPageItems = () => {
  const dispatch = useDispatch();
  const isAirgappedInstance = isAirgapped();

  const checkLayoutSystemFeatures = useLayoutSystemFeatures();
  const [enableGenerateCrud, enableForkingFromTemplates] =
    checkLayoutSystemFeatures([
      LayoutSystemFeatures.ENABLE_GENERATE_CRUD_APP,
      LayoutSystemFeatures.ENABLE_FORKING_FROM_TEMPLATES,
    ]);

  return useMemo(() => {
    const items = [];

    if (enableGenerateCrud) {
      items.push({
        title: createMessage(GENERATE_PAGE_ACTION_TITLE),
        icon: "database-2-line",
        onClick: () => dispatch(openGeneratePageModal()),
        "data-testid": "generate-page",
        key: "GENERATE_PAGE",
      });
    }

    if (enableForkingFromTemplates && !isAirgappedInstance) {
      items.push({
        title: createMessage(ADD_PAGE_FROM_TEMPLATE),
        icon: "layout-2-line",
        onClick: () =>
          dispatch(showTemplatesModal({ isOpenFromCanvas: false })),
        "data-testid": "add-page-from-template",
        key: "ADD_PAGE_FROM_TEMPLATE",
      });
    }

    return items;
  }, [
    dispatch,
    enableGenerateCrud,
    enableForkingFromTemplates,
    isAirgappedInstance,
  ]);
};
