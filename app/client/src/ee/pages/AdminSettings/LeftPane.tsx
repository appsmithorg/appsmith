export * from "ce/pages/AdminSettings/LeftPane";
import React from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Categories,
  getSettingsCategory,
  HeaderContainer,
  StyledHeader,
  Wrapper,
} from "ce/pages/AdminSettings/LeftPane";
import { AclFactory, OthersFactory } from "./config";
import { getCurrentUser } from "selectors/usersSelectors";
import type { Category } from "./config/types";
import { getTenantPermissions } from "@appsmith/selectors/tenantSelectors";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";

import { isAirgapped } from "@appsmith/utils/airgapHelpers";

function getAclCategory() {
  return Array.from(AclFactory.categories);
}

function getOthersCategory() {
  return Array.from(OthersFactory.categories);
}

export default function LeftPane() {
  const categories = getSettingsCategory();
  const aclCategories = getAclCategory();
  /** otherCategories will be built from its own factory in future;
   * The last value in `categories` (ATM) is AuditLogs.
   * */
  // const othersCategories: Category[] = [categories.splice(-1, 1)[0]];
  const othersCategories = getOthersCategory();
  const { category, selected: subCategory } = useParams() as any;
  const user = useSelector(getCurrentUser);
  const isSuperUser = user?.isSuperUser;
  const tenantPermissions = useSelector(getTenantPermissions);
  const isAuditLogsEnabled = isPermitted(
    tenantPermissions,
    PERMISSION_TYPE.READ_AUDIT_LOGS,
  );
  const isAirgappedInstance = isAirgapped();

  const filteredGeneralCategories = categories
    ?.map((category) => {
      if (isAirgappedInstance && category.slug === "google-maps") {
        return null;
      }
      return category;
    })
    .filter(Boolean) as Category[];

  const filteredAclCategories = aclCategories
    ?.map((category) => {
      if (category.title === "Users" && !isSuperUser) {
        return null;
      }
      return category;
    })
    .filter(Boolean) as Category[];

  const filteredOthersCategories = othersCategories
    ?.map((category) => {
      return category;
    })
    .filter(Boolean) as Category[];

  return (
    <Wrapper>
      {isSuperUser && (
        <HeaderContainer>
          <StyledHeader kind="heading-s" renderAs="p">
            Admin settings
          </StyledHeader>
          <Categories
            categories={filteredGeneralCategories}
            currentCategory={category}
            currentSubCategory={subCategory}
          />
        </HeaderContainer>
      )}
      <HeaderContainer>
        <StyledHeader kind="heading-s" renderAs="p">
          Access control
        </StyledHeader>
        <Categories
          categories={filteredAclCategories}
          currentCategory={category}
          currentSubCategory={subCategory}
        />
      </HeaderContainer>
      {isAuditLogsEnabled && (
        <HeaderContainer>
          <StyledHeader kind="heading-s" renderAs="p">
            Others
          </StyledHeader>
          <Categories
            categories={filteredOthersCategories}
            currentCategory={category}
            currentSubCategory={subCategory}
          />
        </HeaderContainer>
      )}
    </Wrapper>
  );
}
