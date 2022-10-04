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
import { AclFactory } from "./config";
import { selectFeatureFlags } from "selectors/usersSelectors";
import { Category } from "./config/types";

export * from "ce/pages/AdminSettings/LeftPane";

function getAclCategory() {
  return Array.from(AclFactory.categories);
}

export default function LeftPane() {
  const categories = getSettingsCategory();
  const aclCategories = getAclCategory();
  /** otherCategories will be built from its own factory in future;
   * The last value in `categories` (ATM) is AuditLogs.
   * */
  const othersCategories: Category[] = [categories.splice(-1, 1)[0]];
  const { category, selected: subCategory } = useParams() as any;
  const featureFlags = useSelector(selectFeatureFlags);

  return (
    <Wrapper>
      <HeaderContainer>
        <StyledHeader>Admin Settings</StyledHeader>
      </HeaderContainer>
      <Categories
        categories={categories}
        currentCategory={category}
        currentSubCategory={subCategory}
      />
      {featureFlags.RBAC && (
        <HeaderContainer>
          <StyledHeader>Access Control</StyledHeader>
          <Categories
            categories={aclCategories}
            currentCategory={category}
            currentSubCategory={subCategory}
          />
        </HeaderContainer>
      )}
      {featureFlags.AUDIT_LOGS && (
        <HeaderContainer>
          <StyledHeader>Others</StyledHeader>
          <Categories
            categories={othersCategories}
            currentCategory={category}
            currentSubCategory={subCategory}
          />
        </HeaderContainer>
      )}
    </Wrapper>
  );
}
