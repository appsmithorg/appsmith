import React, { useCallback } from "react";
import { Button, Text } from "@appsmith/ads";
import type { AppState } from "ee/reducers";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { INTEGRATION_EDITOR_MODES, INTEGRATION_TABS } from "constants/routes";
import history from "utils/history";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { WidgetType } from "constants/WidgetConstants";
import { integrationEditorURL } from "ee/RouteBuilder";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import { DocsLink, openDoc } from "../../../constants/DocumentationLinks";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import { getCurrentBaseModuleId } from "ee/selectors/modulesSelector";

const Container = styled.div`
  height: 75px;
  padding: var(--ads-v2-spaces-3) var(--ads-v2-spaces-3);
  margin: var(--ads-v2-spaces-2) var(--ads-v2-spaces-4);
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-3);
  background-color: var(--ads-v2-color-bg-subtle);
  border-radius: var(--ads-v2-border-radius);
`;

export const actionsExist = (state: AppState): boolean =>
  !!state.entities.actions.length;

interface ConnectDataCTAProps {
  widgetTitle: string;
  widgetId?: string;
  widgetType?: WidgetType;
}

function ConnectDataCTA(props: ConnectDataCTAProps) {
  const basePageId: string = useSelector(getCurrentBasePageId);
  const baseModuleId: string = useSelector(getCurrentBaseModuleId);

  const onClick = useCallback(() => {
    const { widgetId, widgetTitle, widgetType } = props;
    const refirectionProps: Parameters<typeof integrationEditorURL>[0] & {
      baseModuleId?: string;
    } = {
      selectedTab: INTEGRATION_TABS.NEW,
      params: { mode: INTEGRATION_EDITOR_MODES.AUTO },
    };

    if (baseModuleId) {
      refirectionProps.baseModuleId = baseModuleId;
    } else {
      refirectionProps.basePageId = basePageId;
    }

    history.push(integrationEditorURL(refirectionProps));

    AnalyticsUtil.logEvent("CONNECT_DATA_CLICK", {
      widgetTitle,
      widgetId,
      widgetType,
    });

    // Event for datasource creation click
    const entryPoint = DatasourceCreateEntryPoints.PROPERTY_PANE_CONNECT_DATA;

    AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
      entryPoint,
    });
  }, [baseModuleId, basePageId, props]);

  return (
    <Container className="flex flex-col t--propertypane-connect-cta">
      <Text kind="heading-xs">Data required</Text>
      <div className="flex gap-3">
        <Button onClick={onClick} tabIndex={0}>
          Connect data
        </Button>
        <Button
          kind="secondary"
          onClick={() => openDoc(DocsLink.CONNECT_DATA)}
          tabIndex={0}
        >
          Learn more
        </Button>
      </div>
    </Container>
  );
}

export default React.memo(ConnectDataCTA);
