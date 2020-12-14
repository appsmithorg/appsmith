import { PluginType } from "entities/Action";
import React from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { getPlugins } from "selectors/entitiesSelector";
import styled from "styled-components";
import { getPluginGroups, ACTION_PLUGIN_MAP } from "../Actions/helpers";
import { useActions, useFilteredDatasources } from "../hooks";

const AddWidget = styled.button`
  margin: 25px 0px;
  padding: 6px 38px;
  background-color: transparent;
  border: 1px solid #f3672a;
  color: #f3672a;
  font-weight: bold;
  cursor: pointer;
`;

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
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
    plugin => plugin?.type === PluginType.DB,
  );

  return (
    <>
      <Wrapper>
        <AddWidget className="t--add-widget" onClick={props.showWidgetsSidebar}>
          Add Widget
        </AddWidget>
      </Wrapper>
      {getPluginGroups(
        currentPage,
        0,
        actions[currentPage.pageId] || [],
        datasources[currentPage.pageId] || [],
        plugins,
        "",
        dbPluginMap,
      )}
    </>
  );
};

export default DBQueryGroup;
