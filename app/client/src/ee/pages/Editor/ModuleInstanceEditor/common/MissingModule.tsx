import React from "react";

import styled from "styled-components";
import { Link, Text } from "design-system";
import {
  createMessage,
  IMPORT_PACKAGE,
  UPDATE_PACKAGE,
} from "@appsmith/constants/messages";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { useSelector } from "react-redux";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import { packageSettingsURL } from "@appsmith/RouteBuilder";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";

interface MissingModuleProps {
  moduleInstance: ModuleInstance;
}

const StyledContainer = styled.div`
  width: 400px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StyledDescriptionWrapper = styled.div`
  margin-top: var(--ads-spaces-7);
  margin-bottom: var(--ads-spaces-6);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--ads-spaces-3);
`;

const StyledLink = styled(Link)`
  & > span {
    font-weight: 500 !important;
  }
`;

const StyledText = styled(Text)`
  text-align: center;
`;

function MissingModule({ moduleInstance }: MissingModuleProps) {
  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);
  const { id, invalids, originPackageId } = moduleInstance;
  const messages = invalids || [];

  if (originPackageId) {
    urlBuilder.setPackageParams({
      packageId: originPackageId,
    });
  }

  /**
   * The passing of moduleId in package settings url generation process is
   * a hack to overcome a limitation in the URLAssembly to generate cross
   * editor routes. In order to overcome this limitation module instance id
   * is being passed as moduleId but with the presence generateEditorPath the
   * moduleId does not get included in the url but only used to make the URLAssembly
   * class to identify the editor as package rather than app. This however should
   * be fixed by having a better implementation of the URLAssembly.
   */
  const redirectUrl = originPackageId
    ? packageSettingsURL({
        moduleId: id,
        generateEditorPath: true,
        tab: "import",
      })
    : `/applications?workspaceId=${currentWorkspaceId}&openImportModal=true`;

  const ctaText = originPackageId
    ? createMessage(UPDATE_PACKAGE)
    : createMessage(IMPORT_PACKAGE);

  return (
    <StyledContainer>
      <img src={getAssetUrl(`${ASSETS_CDN_URL}/missing-module.svg`)} />
      <StyledDescriptionWrapper>
        {messages.map((message, index) => {
          return (
            <StyledText isBold key={index} renderAs="p">
              {message}
            </StyledText>
          );
        })}
      </StyledDescriptionWrapper>
      <StyledLink
        endIcon="share-2"
        kind="primary"
        target="_blank"
        to={redirectUrl}
      >
        {ctaText}
      </StyledLink>
    </StyledContainer>
  );
}

export default MissingModule;
