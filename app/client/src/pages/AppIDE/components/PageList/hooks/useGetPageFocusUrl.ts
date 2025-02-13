import { useEffect, useState } from "react";
import { builderURL } from "ee/RouteBuilder";
import { useGitCurrentBranch } from "pages/Editor/gitSync/hooks/modHooks";
import { useSelector } from "react-redux";
import { getCurrentFocusInfo } from "selectors/focusHistorySelectors";
import { createPageFocusInfoKey } from "ee/navigation/FocusStrategy/AppIDEFocusStrategy";
import { FocusElement } from "navigation/FocusElements";

export const useGetPageFocusUrl = (basePageId: string): string => {
  const [focusPageUrl, setFocusPageUrl] = useState(builderURL({ basePageId }));

  const branch = useGitCurrentBranch();

  const pageStateFocusInfo = useSelector((appState) =>
    getCurrentFocusInfo(appState, createPageFocusInfoKey(basePageId, branch)),
  );

  useEffect(
    function handleUpdateOfPageLink() {
      if (pageStateFocusInfo) {
        const lastSelectedEntity =
          pageStateFocusInfo.state[FocusElement.SelectedEntity];

        setFocusPageUrl(builderURL({ basePageId, suffix: lastSelectedEntity }));
      }
    },
    [pageStateFocusInfo, branch, basePageId],
  );

  return focusPageUrl;
};
