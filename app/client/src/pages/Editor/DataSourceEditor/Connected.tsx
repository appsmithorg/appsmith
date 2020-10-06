import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { AppState } from "reducers";
import { isNil, map, get } from "lodash";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import { getDatasource } from "selectors/entitiesSelector";
import history from "utils/history";
import styled from "styled-components";
import { createActionRequest } from "actions/actionActions";
import { QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID } from "constants/routes";
import { createNewQueryName } from "utils/AppsmithUtils";
import { getCurrentPageId } from "selectors/editorSelectors";

const ConnectedText = styled.div`
  height: 120px;
  padding: 37px 0;
  background: radial-gradient(
      25vh circle at center,
      #29cca3 50%,
      transparent 51%
    ),
    radial-gradient(50vh circle at center, #51d5b4 50%, transparent 51%),
    radial-gradient(100vh circle at center, #79dfc6 50%, transparent 50.4%),
    radial-gradient(200vh circle at center, #c9f2e8 50%, transparent 51%);
  color: white;
  font-size: 17px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 28px;
  width: 100%;
`;

const Wrapper = styled.div`
  display: flex;
  flexdirection: column;
`;

const ActionButton = styled(BaseButton)`
  &&& {
    max-width: 140px;
    margin: 30px 5px;
    min-height: 30px;
    align-self: center;
  }
`;

const Key = styled.div`
  color: #d0d7dd;
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
`;

const Value = styled.div`
  font-size: 14px;
  font-weight: 400;
  display: inline-block;
`;

const Connected = () => {
  const params = useParams<{ datasourceId: string; applicationId: string }>();
  const datasource = useSelector((state: AppState) =>
    getDatasource(state, params.datasourceId),
  );
  const dispatch = useDispatch();
  const actions = useSelector((state: AppState) => state.entities.actions);
  const currentPageId = useSelector(getCurrentPageId);
  const datasourceFormConfigs = useSelector(
    (state: AppState) => state.entities.plugins.formConfigs,
  );

  const createQueryAction = useCallback(() => {
    const newQueryName = createNewQueryName(actions, currentPageId || "");

    dispatch(
      createActionRequest({
        name: newQueryName,
        pageId: currentPageId,
        pluginId: datasource?.pluginId,
        datasource: {
          id: datasource?.id,
        },
        actionConfiguration: {},
      }),
    );
    history.push(
      QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID(
        params.applicationId,
        currentPageId,
        currentPageId,
      ),
    );
  }, [dispatch, actions, currentPageId, params.applicationId, datasource]);
  const currentFormConfig: Array<any> =
    datasourceFormConfigs[datasource?.pluginId ?? ""];

  return (
    <Wrapper>
      <ConnectedText>Connected</ConnectedText>
      <div style={{ marginTop: "36px" }}>
        {!isNil(currentFormConfig)
          ? renderMainSection(currentFormConfig[0], datasource)
          : undefined}
      </div>
      <ActionButton
        icon={"plus"}
        text="New Query"
        filled
        accent="primary"
        onClick={createQueryAction}
      />
    </Wrapper>
  );
};

const renderMainSection = (section: any, datasource: any): any => {
  return (
    <>
      {map(section.children, subSection => {
        if ("children" in subSection) {
          return renderMainSection(subSection, datasource);
        } else {
          try {
            const { label, configProperty, controlType } = subSection;
            let value = get(datasource, configProperty);

            if (controlType === "KEYVALUE_ARRAY") {
              const configPropertyInfo = configProperty.split("[*].");
              const values = get(datasource, configPropertyInfo[0]);
              const keyValuePair = values[0];
              value = keyValuePair[configPropertyInfo[1]];
            }

            return (
              <div style={{ marginTop: 9 }}>
                <Key>{label}: </Key> <Value>{value}</Value>
              </div>
            );
          } catch (e) {}
        }
      })}
    </>
  );
};

export default Connected;
