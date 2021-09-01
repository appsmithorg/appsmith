import Boxed from "components/editorComponents/Onboarding/Boxed";
import OnboardingIndicator from "components/editorComponents/Onboarding/Indicator";
import {
  OnboardingHelperConfig,
  OnboardingStep,
} from "constants/OnboardingConstants";
import { PluginType } from "entities/Action";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { getHelperConfig } from "sagas/OnboardingSagas";
import { getPlugins } from "selectors/entitiesSelector";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getPluginGroups, ACTION_PLUGIN_MAP } from "../Actions/helpers";
import { useActions, useFilteredDatasources } from "../hooks";
import DragTableGif from "assets/gifs/table_drag.gif";
import { setCurrentSubstep, setHelperConfig } from "actions/onboardingActions";

const AddWidget = styled.button`
  margin-bottom: 25px;
  padding: 7px 38px;
  background-color: #f3672a;
  color: white;
  border: none;
  font-weight: bold;
  cursor: pointer;
`;

const AddWidgetWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const Wrapper = styled.div`
  padding-top: 25px;
`;

function DBQueryGroup(props: any) {
  const pages = useSelector((state: AppState) => {
    return state.entities.pageList.pages;
  });
  const currentPage = pages[0];
  const actions = useActions("");
  const datasources = useFilteredDatasources("");
  const plugins = useSelector(getPlugins);
  const dbPluginMap = ACTION_PLUGIN_MAP.filter((plugin) =>
    plugin?.types.includes(PluginType.DB),
  );
  const addedWidget = useSelector(
    (state: AppState) => state.ui.onBoarding.addedWidget,
  );
  const dispatch = useDispatch();
  const helperConfig = getHelperConfig(
    OnboardingStep.RUN_QUERY_SUCCESS,
  ) as OnboardingHelperConfig;

  useEffect(() => {
    if (addedWidget) {
      props.showWidgetsSidebar();
    }
  }, [addedWidget]);

  return (
    <Wrapper>
      <Boxed step={OnboardingStep.RUN_QUERY_SUCCESS}>
        <AddWidgetWrapper>
          <OnboardingIndicator
            step={OnboardingStep.RUN_QUERY_SUCCESS}
            width={160}
          >
            <AddWidget
              className="t--add-widget"
              onClick={() => {
                AnalyticsUtil.logEvent("ONBOARDING_ADD_WIDGET_CLICK");
                dispatch(
                  setHelperConfig({
                    ...helperConfig,
                    image: {
                      src: DragTableGif,
                    },
                  }),
                );
                dispatch(setCurrentSubstep(2));
                props.showWidgetsSidebar();
              }}
            >
              Add Widget
            </AddWidget>
          </OnboardingIndicator>
        </AddWidgetWrapper>
      </Boxed>
      {getPluginGroups(
        currentPage,
        0,
        actions[currentPage.pageId] || [],
        datasources[currentPage.pageId] || [],
        plugins,
        "",
        dbPluginMap,
      )}
    </Wrapper>
  );
}

export default DBQueryGroup;
