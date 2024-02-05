import {
  generateCdApiKeyAction,
  resetCdApiKeyAction,
  setLoadCdKeyOnMountAction,
} from "@appsmith/actions/gitExtendedActions";
import {
  cdApiKeySelector,
  generateCdApiKeyLoadingSelector,
  loadCdKeyOnMountSelector,
} from "@appsmith/selectors/gitExtendedSelectors";
import { Button, Callout, Icon, Text } from "design-system";
import { CopyButton } from "pages/Editor/gitSync/components/CopyButton";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { CopyContainer, CopyText } from "./styles";
import {
  createMessage,
  GIT_CD_API_KEY_WARNING,
  GIT_CD_COPY_API_KEY,
} from "@appsmith/constants/messages";

const Container = styled.div`
  overflow: auto;
  margin-bottom: 16px;
`;

interface GenerateAPIKeyProps {
  compact?: boolean;
  ctaText?: string;
  descText?: string;
  onClickOverride?: () => void;
  onClick?: () => void;
}

function GenerateAPIKey({
  compact = false,
  ctaText = "Generate API Key",
  descText = "Generate API key",
  onClick,
  onClickOverride,
}: GenerateAPIKeyProps) {
  const cdApiKey = useSelector(cdApiKeySelector);
  const generateCdApiKeyLoading = useSelector(generateCdApiKeyLoadingSelector);
  const loadCdKeyOnMount = useSelector(loadCdKeyOnMountSelector);

  const maskedCdApiKey = useMemo(() => {
    if (!cdApiKey) return "";
    const firstPart = cdApiKey.slice(0, 4);
    return `${firstPart}*************************************`;
  }, [cdApiKey]);

  useEffect(() => {
    if (loadCdKeyOnMount) {
      dispatch(generateCdApiKeyAction());
      dispatch(setLoadCdKeyOnMountAction(false));
    }

    return () => {
      dispatch(resetCdApiKeyAction());
    };
  }, []);

  const dispatch = useDispatch();

  const handleGenerateCdApiKey = () => {
    dispatch(generateCdApiKeyAction());
    if (typeof onClick === "function") {
      onClick();
    }
  };

  return (
    <Container>
      <div className={compact ? "mb-1" : "mb-2"}>
        <Text renderAs="p">{descText}</Text>
      </div>
      {!cdApiKey ? (
        <Button
          isLoading={generateCdApiKeyLoading}
          kind="secondary"
          onClick={
            typeof onClickOverride === "function"
              ? onClickOverride
              : handleGenerateCdApiKey
          }
          size="md"
        >
          {ctaText}
        </Button>
      ) : (
        <>
          <CopyContainer>
            <Icon
              color="var(--ads-v2-color-fg)"
              name="key-2-line"
              size="md"
              style={{ marginRight: 4 }}
            />
            <CopyText>{maskedCdApiKey}</CopyText>
            <CopyButton
              style={{ marginLeft: "auto" }}
              tooltipMessage={createMessage(GIT_CD_COPY_API_KEY)}
              value={cdApiKey}
            />
          </CopyContainer>
          <Callout className="mt-1" kind="warning">
            {createMessage(GIT_CD_API_KEY_WARNING)}
          </Callout>
        </>
      )}
    </Container>
  );
}

export default GenerateAPIKey;
