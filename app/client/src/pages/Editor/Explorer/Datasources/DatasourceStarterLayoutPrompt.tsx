import React, { useCallback } from "react";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverTrigger,
  Text,
  Button,
} from "design-system";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { importSvg } from "design-system-old";

import {
  buildingBlocksSourcePageIdSelector,
  starterBuildingBlockDatasourcePromptSelector,
} from "selectors/templatesSelectors";
import { hideStarterBuildingBlockDatasourcePrompt } from "actions/templateActions";
import {
  STARTER_TEMPLATE_PAGE_LAYOUTS,
  createMessage,
} from "@appsmith/constants/messages";
import history from "utils/history";
import { integrationEditorURL } from "@appsmith/RouteBuilder";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { INTEGRATION_TABS } from "constants/routes";
import { Colors } from "constants/Colors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { STARTER_BUILDING_BLOCK_TEMPLATE_NAME } from "constants/TemplatesConstants";

function DatasourceStarterLayoutPrompt() {
  const dispatch = useDispatch();

  const currentApplicationId = useSelector(getCurrentApplicationId);
  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);
  const pageId = useSelector(getCurrentPageId);
  const showDatasourcePrompt = useSelector(
    starterBuildingBlockDatasourcePromptSelector,
  );
  const buildingBlockSourcePageId = useSelector(
    buildingBlocksSourcePageIdSelector,
  );

  const disablePrompt = () =>
    dispatch(hideStarterBuildingBlockDatasourcePrompt());

  const showActivePageDatasourcePrompt =
    buildingBlockSourcePageId === pageId && showDatasourcePrompt;

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
        templateAppName: STARTER_BUILDING_BLOCK_TEMPLATE_NAME,
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
          <Button onClick={onClickConnect}>
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
  margin-left: 23px;
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
  left: -15px;
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
