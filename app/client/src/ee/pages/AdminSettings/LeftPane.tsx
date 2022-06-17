export * from "ce/pages/AdminSettings/LeftPane";
import React from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  getSettingsCategory,
  Wrapper,
  HeaderContainer,
  StyledHeader,
  Categories,
} from "ce/pages/AdminSettings/LeftPane";
import { AclFactory } from "./config";
import { selectFeatureFlags } from "selectors/usersSelectors";

function getAclCategory() {
  return Array.from(AclFactory.categories);
}

export default function LeftPane() {
  const categories = getSettingsCategory();
  const aclCategories = getAclCategory();
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
    </Wrapper>
  );
}
