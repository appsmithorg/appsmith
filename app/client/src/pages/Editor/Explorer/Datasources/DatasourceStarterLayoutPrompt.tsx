import {
  Button,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
} from "design-system";
import { importSvg } from "design-system-old";
import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

import { integrationEditorURL } from "@appsmith/RouteBuilder";
import {
  STARTER_TEMPLATE_PAGE_LAYOUTS,
  createMessage,
} from "@appsmith/constants/messages";
import { useAppWideAndOtherDatasource } from "@appsmith/pages/Editor/Explorer/hooks";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { hideStarterBuildingBlockDatasourcePrompt } from "actions/templateActions";
import { Colors } from "constants/Colors";
import { INTEGRATION_TABS } from "constants/routes";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  buildingBlocksSourcePageIdSelector,
  currentForkingBuildingBlockName,
  starterBuildingBlockDatasourcePromptSelector,
} from "selectors/templatesSelectors";
import history from "utils/history";

function DatasourceStarterLayoutPrompt() {
  const dispatch = useDispatch();

  const currentApplicationId = useSelector(getCurrentApplicationId);
  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);
  const pageId = useSelector(getCurrentPageId);
  const showDatasourcePrompt = useSelector(
    starterBuildingBlockDatasourcePromptSelector,
  );
  const currentForkedBuildingBlockName = useSelector(
    currentForkingBuildingBlockName,
  );
  const buildingBlockSourcePageId = useSelector(
    buildingBlocksSourcePageIdSelector,
  );
  const { appWideDS } = useAppWideAndOtherDatasource();

  const disablePrompt = () =>
    dispatch(hideStarterBuildingBlockDatasourcePrompt());

  const showActivePageDatasourcePrompt = useMemo(
    () =>
      buildingBlockSourcePageId === pageId &&
      showDatasourcePrompt &&
      // Here we are checking, if user already has some datasources added to the application
      // in few cases user go through "start with data" and then "forks a starter building block from canvas"
      // this condition prevents showing the popup if datasource is already connected.
      appWideDS.length === 1,
    [buildingBlockSourcePageId, pageId, showDatasourcePrompt, appWideDS],
  );

  const onClickConnect = useCallback(() => {
    dispatch(hideStarterBuildingBlockDatasourcePrompt());
    history.push(
      integrationEditorURL({
        pageId,
        selectedTab: INTEGRATION_TABS.NEW,
      }),
    );

    AnalyticsUtil.logEvent("STARTER_BUILDING_BLOCK_CONNECT_DATA_CLICK", {
      applicationId: currentApplicationId,
      workspaceId: currentWorkspaceId,
      source: "canvas",
      eventData: {
        templateAppName: currentForkedBuildingBlockName,
      },
    });
  }, [pageId]);

  return (
    <Popover onOpenChange={disablePrompt} open={showActivePageDatasourcePrompt}>
      {/* Removing this trigger will stop Popover from rendering */}
      <PopoverTrigger>
        <div />
      </PopoverTrigger>

      <StyledPopoverContent align="start" className="z-[25]" side="left">
        <Ellipse>
          <InnerEllipse />
        </Ellipse>

        <PopoverHeader className="sticky top-0" isClosable>
          {createMessage(
            STARTER_TEMPLATE_PAGE_LAYOUTS.datasourceConnectPrompt.header,
          )}
        </PopoverHeader>
        <PopoverBody className={"!overflow-y-clip"}>
          <Text kind="body-m">
            Your application is now using sample data, but with Appsmith you can
            do much more! Click on <strong>Datasources</strong>, and
            <strong> make this application yours in a blink!</strong>
          </Text>

          <PromptImage />
        </PopoverBody>

        <BtnContainer>
          <Button
            data-testid="t--datasource-connect-prompt-submit-btn"
            onClick={onClickConnect}
          >
            {createMessage(
              STARTER_TEMPLATE_PAGE_LAYOUTS.datasourceConnectPrompt.buttonText,
            )}
          </Button>
        </BtnContainer>
      </StyledPopoverContent>
    </Popover>
  );
}

export default DatasourceStarterLayoutPrompt;

const PromptImage = importSvg(
  async () =>
    import(
      "../../../../assets/icons/templates/starter-template-datasource-prompt.svg"
    ),
);

const StyledPopoverContent = styled(PopoverContent)`
  margin-left: 43px;
  width: 282px;
  padding-vertical: 12px;
  border-radius: 4px;
  border-width: 1px;
  border-color: ${Colors.GEYSER};
  display: flex;
  flex-direction: column;
`;

const Ellipse = styled.div`
  position: absolute;
  top: 0px;
  left: 5px;
  width: 36px;
  height: 36px;
  background: rgba(225, 86, 21, 0.2);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const InnerEllipse = styled.div`
  width: 18px;
  height: 18px;
  background: ${Colors.PRIMARY_ORANGE};
  border-radius: 50%;
`;

const BtnContainer = styled(Button)`
  align-self: flex-end;
`;
