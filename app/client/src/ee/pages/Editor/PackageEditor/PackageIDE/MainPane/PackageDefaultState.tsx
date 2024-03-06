import React, { useState } from "react";
import { Redirect } from "react-router";

import styled from "styled-components";
import { Button, Link, Text } from "design-system";
import {
  PACKAGE_EMPTY_STATE_MSG,
  PACKAGE_EMPTY_STATE_HELP,
  createMessage,
  PACKAGE_EMPTY_STATE_CTA,
} from "@appsmith/constants/messages";
import CreateNewModuleMenu from "@appsmith/pages/Editor/PackageExplorer/Modules/CreateNewModuleMenu";
import { useSelector } from "react-redux";
import { hasCreateModulePermission } from "@appsmith/utils/permissionHelpers";
import {
  getCurrentPackage,
  getFirstModule,
} from "@appsmith/selectors/packageSelectors";
import { moduleEditorURL } from "@appsmith/RouteBuilder";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { getModuleById } from "@appsmith/selectors/modulesSelector";

interface PackageDefaultStateProps {
  lastVisitedModuleId?: string;
}

const StyledContainer = styled.div`
  width: 300px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StyledDescriptionWrapper = styled.div`
  margin-top: var(--ads-spaces-12);
  margin-bottom: var(--ads-spaces-7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--ads-spaces-3);
`;

const StyledEmptyMsg = styled(Text)`
  font-weight: 700 !important;
`;

const StyledLink = styled(Link)`
  & > span {
    font-weight: 500 !important;
  }
`;

function PackageDefaultState({
  lastVisitedModuleId,
}: PackageDefaultStateProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userPackagePermissions =
    useSelector(getCurrentPackage)?.userPermissions ?? [];
  const firstModule = useSelector(getFirstModule);
  const lastVisitedModule = useSelector((state) =>
    getModuleById(state, lastVisitedModuleId || ""),
  );

  const canCreateModules = hasCreateModulePermission(userPackagePermissions);

  const closeMenu = () => setIsMenuOpen(false);
  const openMenu = () => setIsMenuOpen(true);

  const cta = (
    <Button endIcon="arrow-down-s-line" onClick={openMenu}>
      {createMessage(PACKAGE_EMPTY_STATE_CTA)}
    </Button>
  );

  if (lastVisitedModule) {
    const redirectUrl = moduleEditorURL({ moduleId: lastVisitedModule.id });
    return <Redirect to={redirectUrl} />;
  }

  if (firstModule) {
    const redirectUrl = moduleEditorURL({ moduleId: firstModule.id });
    return <Redirect to={redirectUrl} />;
  }

  return (
    <StyledContainer>
      <img src={getAssetUrl(`${ASSETS_CDN_URL}/empty-package.svg`)} />
      <StyledDescriptionWrapper>
        <StyledEmptyMsg
          color="var(--ads-color-black-900)"
          isBold
          kind="action-s"
          renderAs="p"
        >
          {createMessage(PACKAGE_EMPTY_STATE_MSG)}
        </StyledEmptyMsg>
        <StyledLink kind="primary" startIcon="question" to="#">
          {createMessage(PACKAGE_EMPTY_STATE_HELP)}
        </StyledLink>
      </StyledDescriptionWrapper>
      <CreateNewModuleMenu
        canCreate={canCreateModules}
        closeMenu={closeMenu}
        isOpen={isMenuOpen}
        triggerElement={cta}
      />
    </StyledContainer>
  );
}

export default PackageDefaultState;
