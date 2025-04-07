import React from "react";
import styled from "styled-components";
import AdminConfig from "ee/pages/AdminSettings/config";
import {
  CategoryType,
  type Category,
} from "ee/pages/AdminSettings/config/types";
import { adminSettingsCategoryUrl } from "ee/RouteBuilder";
import { useParams } from "react-router";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { Link, Text } from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { getCurrentUser } from "selectors/usersSelectors";
import BusinessTag from "components/BusinessTag";
import EnterpriseTag from "components/EnterpriseTag";
import { getOrganizationPermissions } from "ee/selectors/organizationSelectors";
import {
  getFilteredOrgCategories,
  getFilteredUserManagementCategories,
  getFilteredInstanceCategories,
} from "ee/utils/adminSettingsHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasAuditLogsReadPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";

export const Wrapper = styled.div`
  flex-basis: ${(props) => props.theme.sidebarWidth};
  overflow-y: auto;
  border-right: 1px solid var(--ads-v2-color-border);
  flex-shrink: 0;
  padding: 12px 0;

  &::-webkit-scrollbar {
    display: none;
  }

  > div:not(:first-child) {
    border-top: 1px solid var(--ads-v2-color-border);
  }
`;

export const HeaderContainer = styled.div`
  margin: 12px;
`;

export const StyledHeader = styled(Text)`
  height: 20px;
  margin: 16px;
  color: var(--ads-v2-color-fg-emphasis);
`;

export const CategoryList = styled.ul`
  margin: 0;
  list-style-type: none;
`;

export const CategoryItem = styled.li`
  /* width: 90%; */
`;

export const StyledLink = styled(Link)<{ $active: boolean }>`
  padding: 8px 16px;
  border-radius: var(--ads-v2-border-radius);
  background-color: ${(props) =>
    props.$active ? `var(--ads-v2-color-bg-muted)` : ""};
  text-decoration: none !important;

  .ads-v2-text {
    display: flex;
    gap: var(--ads-v2-spaces-3);
    align-items: center;
  }

  && {
    color: var(--ads-v2-color-fg);
  }

  &:hover {
    text-decoration: none;
  }

  &:hover:not(.active) {
    background-color: var(--ads-v2-color-bg-subtle);
  }
`;

export const SettingName = styled(Text)<{ active?: boolean }>`
  color: ${(props) =>
    props.active
      ? "var(--ads-v2-color-fg-emphasis-plus)"
      : "var(--ads-v2-color-fg)"};
  font-weight: 400;
`;

export function getSettingsCategory(type: string): Category[] {
  return Array.from(
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AdminConfig.categories.filter((cat: any) => cat.categoryType === type),
  );
}

export function Categories({
  categories,
  currentCategory,
  currentSubCategory,
  parentCategory,
  showSubCategory,
}: {
  categories?: Category[];
  parentCategory?: Category;
  currentCategory: string;
  currentSubCategory?: string;
  showSubCategory?: boolean;
}) {
  const dispatch = useDispatch();

  const triggerAnalytics = (page: string) => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const source: any = {
      "audit-logs": "AuditLogs",
      "access-control": "AccessControl",
      provisioning: "Provisioning",
    };

    AnalyticsUtil.logEvent("ADMIN_SETTINGS_CLICK", {
      source: source[page],
    });
  };

  const onClickHandler = (category: string, showUpgradeTag: boolean) => {
    if (category === "general") {
      dispatch({
        type: ReduxActionTypes.FETCH_ADMIN_SETTINGS,
      });
    }

    if (showUpgradeTag) {
      triggerAnalytics(category);
    }
  };

  return (
    <CategoryList className="t--settings-category-list">
      {categories?.map((config) => {
        const active =
          !!currentSubCategory && showSubCategory
            ? currentSubCategory == config.slug
            : currentCategory == config.slug;
        const showUpgradeTag = config?.isFeatureEnabled === false;

        return (
          <CategoryItem key={config.slug}>
            <StyledLink
              $active={active}
              className={`t--settings-category-${config.slug} ${
                active ? "active" : ""
              }`}
              onClick={() =>
                onClickHandler(config.slug, showUpgradeTag || false)
              }
              startIcon={showUpgradeTag ? "lock-2-line" : `${config.icon}`}
              target="_self"
              to={
                !parentCategory
                  ? adminSettingsCategoryUrl({ category: config.slug })
                  : adminSettingsCategoryUrl({
                      category: parentCategory.slug,
                      selected: config.slug,
                    })
              }
            >
              <SettingName active={active}>{config.title}</SettingName>
              {showUpgradeTag &&
                (config?.isEnterprise ? <EnterpriseTag /> : <BusinessTag />)}
            </StyledLink>
            {showSubCategory && (
              <Categories
                categories={config.children}
                currentCategory={currentCategory}
                currentSubCategory={currentSubCategory}
                parentCategory={config}
              />
            )}
          </CategoryItem>
        );
      })}
    </CategoryList>
  );
}

export default function LeftPane() {
  const profileCategories = getSettingsCategory(CategoryType.PROFILE);
  const organizationCategories = getSettingsCategory(CategoryType.ORGANIZATION);
  const userManagementCategories = getSettingsCategory(
    CategoryType.USER_MANAGEMENT,
  );
  const instanceCategories = getSettingsCategory(CategoryType.INSTANCE);
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { category, selected: subCategory } = useParams() as any;
  const user = useSelector(getCurrentUser);
  const isSuperUser = user?.isSuperUser;
  const organizationPermissions = useSelector(getOrganizationPermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isAuditLogsEnabled = getHasAuditLogsReadPermission(
    isFeatureEnabled,
    organizationPermissions,
  );

  const filteredOrgCategories = getFilteredOrgCategories(
    organizationCategories,
    isAuditLogsEnabled,
    isSuperUser,
  );

  const filteredUserManagmentCategories = getFilteredUserManagementCategories(
    userManagementCategories,
    isSuperUser,
  );

  const filteredInstanceCategories = getFilteredInstanceCategories(
    instanceCategories,
    isSuperUser,
  );

  return (
    <Wrapper>
      {profileCategories.length > 0 && (
        <HeaderContainer>
          <StyledHeader kind="heading-s" renderAs="p">
            Profile
          </StyledHeader>
          <Categories
            categories={profileCategories}
            currentCategory={category}
            currentSubCategory={subCategory}
          />
        </HeaderContainer>
      )}
      {organizationCategories.length > 0 && (
        <HeaderContainer>
          <StyledHeader kind="heading-s" renderAs="p">
            Organisation
          </StyledHeader>
          <Categories
            categories={filteredOrgCategories}
            currentCategory={category}
            currentSubCategory={subCategory}
          />
        </HeaderContainer>
      )}
      {userManagementCategories.length > 0 && (
        <HeaderContainer>
          <StyledHeader kind="heading-s" renderAs="p">
            User management
          </StyledHeader>
          <Categories
            categories={filteredUserManagmentCategories}
            currentCategory={category}
            currentSubCategory={subCategory}
          />
        </HeaderContainer>
      )}
      {instanceCategories.length > 0 && (
        <HeaderContainer>
          <StyledHeader kind="heading-s" renderAs="p">
            Instance
          </StyledHeader>
          <Categories
            categories={filteredInstanceCategories}
            currentCategory={category}
            currentSubCategory={subCategory}
          />
        </HeaderContainer>
      )}
    </Wrapper>
  );
}
