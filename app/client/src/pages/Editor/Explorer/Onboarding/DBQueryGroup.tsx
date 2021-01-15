import Boxed from "components/editorComponents/Onboarding/Boxed";
import OnboardingIndicator from "components/editorComponents/Onboarding/Indicator";
import { OnboardingStep } from "constants/OnboardingConstants";
import { PluginType } from "entities/Action";
import React from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { getPlugins } from "selectors/entitiesSelector";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getPluginGroups, ACTION_PLUGIN_MAP } from "../Actions/helpers";
import { useActions, useFilteredDatasources } from "../hooks";

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

const DBQueryGroup = (props: any) => {
  const pages = useSelector((state: AppState) => {
    return state.entities.pageList.pages;
  });
  const currentPage = pages[0];
  const actions = useActions("");
  const datasources = useFilteredDatasources("");
  const plugins = useSelector(getPlugins);
  const dbPluginMap = ACTION_PLUGIN_MAP.filter(
    (plugin) => plugin?.type === PluginType.DB,
  );

  return (
    <Wrapper>
      <Boxed step={OnboardingStep.RUN_QUERY_SUCCESS}>
        <AddWidgetWrapper>
          <OnboardingIndicator
            step={OnboardingStep.RUN_QUERY_SUCCESS}
            offset={{ bottom: 25 }}
            theme={"light"}
          >
            <AddWidget
              className="t--add-widget"
              onClick={() => {
                AnalyticsUtil.logEvent("ONBOARDING_ADD_WIDGET_CLICK");
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
};

export default DBQueryGroup;
