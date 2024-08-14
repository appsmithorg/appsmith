import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Text } from "@appsmith/ads";
import styled from "styled-components";
import { refreshDatasourceStructure } from "actions/datasourceActions";
import {
  GSHEET_SPREADSHEET_LABEL,
  SCHEMA_LABEL,
  createMessage,
} from "ee/constants/messages";
import type { Datasource } from "entities/Datasource";
import { DatasourceStructureContext } from "entities/Datasource";
import { getPluginPackageNameFromId } from "ee/selectors/entitiesSelector";
import { isGoogleSheetPluginDS } from "utils/editorContextUtils";

interface Props {
  datasource?: Datasource;
  onRefreshCallback?: () => void;
  paddingBottom?: boolean;
  refetchFn?: () => void;
}

const HeaderWrapper = styled.div<{ paddingBottom: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  ${(props) => props.paddingBottom && "padding-bottom: var(--ads-v2-spaces-4);"}
`;

export default function DatasourceStructureHeader(props: Props) {
  const dispatch = useDispatch();

  const dispatchRefresh = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (props.datasource?.id) {
        event.stopPropagation();

        if (props.refetchFn) {
          props.refetchFn();
        } else {
          dispatch(
            refreshDatasourceStructure(
              props.datasource?.id,
              DatasourceStructureContext.QUERY_EDITOR,
            ),
          );
        }

        !!props.onRefreshCallback && props.onRefreshCallback();
      }
    },
    [dispatch, props.datasource?.id],
  );

  const pluginPackageName = useSelector((state) =>
    getPluginPackageNameFromId(state, props.datasource?.pluginId || ""),
  );
  const isGoogleSheetPlugin = isGoogleSheetPluginDS(pluginPackageName);

  return (
    <HeaderWrapper
      className="datasourceStructure-header"
      paddingBottom={!!props.paddingBottom}
    >
      <Text kind="heading-xs" renderAs="h3">
        {createMessage(
          isGoogleSheetPlugin ? GSHEET_SPREADSHEET_LABEL : SCHEMA_LABEL,
        )}
      </Text>
      <Button
        className="datasourceStructure-refresh"
        isIconButton
        kind="tertiary"
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onClick={(event: any) => dispatchRefresh(event)}
        size="md"
        startIcon="refresh"
      />
    </HeaderWrapper>
  );
}
