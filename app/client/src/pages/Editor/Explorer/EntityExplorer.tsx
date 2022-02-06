import React, {
  useRef,
  MutableRefObject,
  useCallback,
  useEffect,
  useState,
} from "react";
import styled from "styled-components";
import Divider from "components/editorComponents/Divider";
import Search from "./ExplorerSearch";
import { NonIdealState, Classes, IPanelProps } from "@blueprintjs/core";
import WidgetSidebar from "../WidgetSidebar";
import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";
import JSDependencies from "./JSDependencies";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { useDispatch, useSelector } from "react-redux";
import ScrollIndicator from "components/ads/ScrollIndicator";

import { ReactComponent as NoEntityFoundSvg } from "assets/svg/no_entities_found.svg";
import { Colors } from "constants/Colors";

import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";

import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import Datasources from "./Datasources";
import Files from "./Files";
import ExplorerWidgetGroup from "./Widgets/WidgetGroup";

const Wrapper = styled.div`
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    width: 0px;
    -webkit-appearance: none;
  }
`;

const NoResult = styled(NonIdealState)`
  &.${Classes.NON_IDEAL_STATE} {
    height: auto;
    margin: 20px 0;

    .${Classes.NON_IDEAL_STATE_VISUAL} {
      margin-bottom: 16px;
      height: 52px;

      svg {
        height: 52px;
        width: 144px;
      }
    }

    div {
      color: ${Colors.DOVE_GRAY2};
    }

    .${Classes.HEADING} {
      margin-bottom: 4px;
      color: ${(props) => props.theme.colors.textOnWhiteBG};
    }
  }
`;

const StyledDivider = styled(Divider)`
  border-bottom-color: #f0f0f0;
`;

function EntityExplorer(props: IPanelProps) {
  const dispatch = useDispatch();
  const [searchKeyword, setSearchKeyword] = useState("");
  const applicationId = useSelector(getCurrentApplicationId);
  const currentPageId = useSelector(getCurrentPageId);
  const searchInputRef: MutableRefObject<HTMLInputElement | null> = useRef(
    null,
  );
  PerformanceTracker.startTracking(PerformanceTransactionName.ENTITY_EXPLORER);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });
  const explorerRef = useRef<HTMLDivElement | null>(null);
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const noResults = false;
  const { openPanel } = props;
  const showWidgetsSidebar = useCallback(() => {
    history.push(BUILDER_PAGE_URL({ applicationId, pageId: currentPageId }));
    openPanel({ component: WidgetSidebar });
    dispatch(forceOpenWidgetPanel(true));
    if (isFirstTimeUserOnboardingEnabled) {
      dispatch(toggleInOnboardingWidgetSelection(true));
    }
  }, [
    openPanel,
    applicationId,
    isFirstTimeUserOnboardingEnabled,
    currentPageId,
  ]);

  /**
   * filter entitites
   */
  const search = (e: any) => {
    setSearchKeyword(e.target.value);
  };

  const clearSearchInput = () => {
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }

    setSearchKeyword("");
  };

  return (
    <Wrapper className={"relative"} ref={explorerRef}>
      {/* SEARCH */}
      <Search
        clear={clearSearchInput}
        isHidden
        onChange={search}
        ref={searchInputRef}
      />
      <ExplorerWidgetGroup
        addWidgetsFn={showWidgetsSidebar}
        searchKeyword={searchKeyword}
        step={0}
      />
      <Files />
      {noResults && (
        <NoResult
          className={Classes.DARK}
          description="Try modifying the search keyword."
          icon={<NoEntityFoundSvg />}
          title="No entities found"
        />
      )}
      <StyledDivider />
      <Datasources />
      <JSDependencies />
      <ScrollIndicator containerRef={explorerRef} />
    </Wrapper>
  );
}

EntityExplorer.displayName = "EntityExplorer";

export default EntityExplorer;
