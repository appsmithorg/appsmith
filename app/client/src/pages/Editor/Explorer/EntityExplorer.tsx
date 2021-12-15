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
import { Datasources } from "./Datasources";
import ExplorerPageEntity from "./Pages/PageEntity";

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
  margin-top: 0;
  margin-bottom: 5px;
`;

const AppLevelIndicator = styled.div`
  text-align: center;
  width: 100%;
  font-size: 10px;
  font-weight: 400;
  color: #716e6e;
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

  // const plugins = useSelector(getPlugins);
  // const widgets = useWidgets(searchKeyword);
  // const actions = useActions(searchKeyword);
  // const jsActions = useJSCollections(searchKeyword);
  // const datasources = useFilteredDatasources(searchKeyword);
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );

  const noResults = false;
  // if (searchKeyword) {
  //   const noWidgets = Object.values(widgets).filter(Boolean).length === 0;
  //   const noJSActions =
  //     Object.values(jsActions).filter(
  //       (jsActions) => jsActions && jsActions.length > 0,
  //     ).length === 0;
  //   const noActions =
  //     Object.values(actions).filter((actions) => actions && actions.length > 0)
  //       .length === 0;
  //   const noDatasource =
  //     Object.values(datasources).filter(
  //       (datasources) => datasources && datasources.length > 0,
  //     ).length === 0;
  //   noResults = noWidgets && noActions && noDatasource && noJSActions;
  // }
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
      <ExplorerPageEntity
        searchKeyword={searchKeyword}
        showWidgetsSidebar={showWidgetsSidebar}
        step={0}
      />
      {noResults && (
        <NoResult
          className={Classes.DARK}
          description="Try modifying the search keyword."
          icon={<NoEntityFoundSvg />}
          title="No entities found"
        />
      )}
      <StyledDivider />
      <AppLevelIndicator className="text-center text-gray-300 text-sm">
        This Application
      </AppLevelIndicator>
      <Datasources />
      <JSDependencies />
      <ScrollIndicator containerRef={explorerRef} />
    </Wrapper>
  );
}

EntityExplorer.displayName = "EntityExplorer";

export default EntityExplorer;
