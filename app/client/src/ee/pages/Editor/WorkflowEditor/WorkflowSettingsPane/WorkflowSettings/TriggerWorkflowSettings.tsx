import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentWorkflowId,
  getIsWorkflowTokenDetails,
  getIsWorkflowTokenGenerating,
} from "@appsmith/selectors/workflowSelectors";
import { Button, Callout, Input, Switch, Text, toast } from "design-system";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { toggleWorkflowToken } from "@appsmith/actions/workflowActions";
import {
  TRIGGER_SETTINGS_SECTION_CONTENT_HEADER,
  WEBHOOK_TRIGGER_SWITCH_LABEL,
  WEBHOOK_TRIGGER_SWITCH_LABEL_DESC,
  WEBHOOK_TRIGGER_TOKEN_WARNING,
  createMessage,
} from "@appsmith/constants/messages";
import copy from "copy-to-clipboard";
import styled from "styled-components";

const InputWrapper = styled.div<{
  alignCenter: boolean;
}>`
  display: flex;
  flex-direction: row;
  align-items: ${(props) => `${props.alignCenter ? "center" : "end"}`};
  gap: 16px;
`;

const TokenInfoWrapper = styled.div`
  display: block;
  margin-top: 8px;
`;

export const SectionTitle = styled(Text)`
  margin-top: 24px;
  margin-bottom: 24px;
`;

function TriggerWorkflowSettings() {
  const currentWorkflowId = useSelector(getCurrentWorkflowId);
  const isWorkflowTokenGenerating = useSelector(getIsWorkflowTokenGenerating);
  const { token, tokenGenerated: isWorkflowTokenGenerated } = useSelector(
    getIsWorkflowTokenDetails,
  );
  const dispatch = useDispatch();

  const host =
    (!!window &&
      !!window.location &&
      !!window.location.host &&
      window.location.host) ||
    "app.appsmith.com";
  const path = `https://${host}/api/v1/workflows/trigger/${currentWorkflowId}`;

  return (
    <div className="flex flex-col mx-[24px] w-[650px]">
      <SectionTitle kind="heading-m">
        {createMessage(TRIGGER_SETTINGS_SECTION_CONTENT_HEADER)}
      </SectionTitle>
      <div className="flex-col justify-between content-center">
        <Switch
          data-testid="t--workflow-token-generation-switch"
          // We are disabling the switch if the workflow token is generated
          isDisabled={isWorkflowTokenGenerating}
          isSelected={isWorkflowTokenGenerated}
          onChange={() => {
            AnalyticsUtil.logEvent("TOGGLE_WORKFLOW_TOKEN", {
              tokeGenerated: !isWorkflowTokenGenerated,
            });
            currentWorkflowId &&
              dispatch(
                toggleWorkflowToken(
                  currentWorkflowId,
                  isWorkflowTokenGenerated,
                ),
              );
          }}
        >
          <Text kind="heading-s">
            {createMessage(WEBHOOK_TRIGGER_SWITCH_LABEL)}
          </Text>
        </Switch>
        <Text kind="body-m">
          {createMessage(WEBHOOK_TRIGGER_SWITCH_LABEL_DESC)}
        </Text>
        {isWorkflowTokenGenerated && (
          <>
            <InputWrapper alignCenter={false} className="mt-[16px]">
              <Input isDisabled label="URL" size="md" value={path} />
              <Button
                kind="tertiary"
                onClick={() => {
                  toast.show("Copied to clipboard", { kind: "success" });
                  copy(path);
                }}
                size="md"
                startIcon="copy-control"
              />
            </InputWrapper>
            <InputWrapper
              alignCenter={token.length === 0}
              className="mt-[16px]"
            >
              <Input
                description={
                  token.length === 0
                    ? "If you don’t have access to bearer token, re-generate it."
                    : undefined
                }
                isDisabled
                label="Bearer Token"
                size="md"
                value={token.length > 0 ? token : "****"}
              />
              {token.length === 0 ? (
                <Button
                  isLoading={isWorkflowTokenGenerating}
                  kind="secondary"
                  onClick={() => {
                    dispatch(
                      toggleWorkflowToken(currentWorkflowId || "", false),
                    );
                  }}
                  size="md"
                >
                  Regenerate
                </Button>
              ) : (
                <Button
                  isDisabled={token.length === 0}
                  kind="tertiary"
                  onClick={() => {
                    if (token.length === 0) return;
                    toast.show("Copied to clipboard", { kind: "success" });
                    copy(token);
                  }}
                  size="md"
                  startIcon="copy-control"
                />
              )}
            </InputWrapper>
            <TokenInfoWrapper className="mt-[16px]">
              {token.length > 0 && (
                <Callout kind="warning">
                  {createMessage(WEBHOOK_TRIGGER_TOKEN_WARNING)}
                </Callout>
              )}
            </TokenInfoWrapper>
          </>
        )}
      </div>
    </div>
  );
}

export default TriggerWorkflowSettings;
