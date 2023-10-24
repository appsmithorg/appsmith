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

import { starterTemplateDatasourcePromptSelector } from "selectors/templatesSelectors";
import { toggleStarterTemplateDatasourcePrompt } from "actions/templateActions";
import {
  STARTER_TEMPLATE_PAGE_LAYOUTS,
  createMessage,
} from "@appsmith/constants/messages";
import history from "utils/history";
import { integrationEditorURL } from "@appsmith/RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import { INTEGRATION_TABS } from "constants/routes";

function DatasourceStarterLayoutPrompt() {
  const dispatch = useDispatch();

  const pageId = useSelector(getCurrentPageId);
  const showDatasourcePrompt = useSelector(
    starterTemplateDatasourcePromptSelector,
  );

  const togglePrompt = () => dispatch(toggleStarterTemplateDatasourcePrompt());

  const onClickConnect = useCallback(() => {
    dispatch(toggleStarterTemplateDatasourcePrompt());
    history.push(
      integrationEditorURL({
        pageId,
        selectedTab: INTEGRATION_TABS.ACTIVE,
      }),
    );
  }, [pageId]);

  return (
    <Popover onOpenChange={togglePrompt} open={showDatasourcePrompt}>
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
            do much more! Click on <strong>Data</strong>, and
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
  border-color: #cdd5df;
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
  background: rgba(225, 86, 21, 1);
  border-radius: 50%;
`;

const BtnContainer = styled(Button)`
  align-self: flex-end;
`;
