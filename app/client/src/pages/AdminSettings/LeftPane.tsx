import React from "react";
import styled from "styled-components";
import AdminConfig from "@appsmith/pages/AdminSettings/config";
import {
  CategoryType,
  type Category,
} from "@appsmith/pages/AdminSettings/config/types";
import { adminSettingsCategoryUrl } from "@appsmith/RouteBuilder";
import { useParams } from "react-router";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Link, Text } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getCurrentUser } from "selectors/usersSelectors";
import BusinessTag from "components/BusinessTag";
import EnterpriseTag from "components/EnterpriseTag";
import { getTenantPermissions } from "@appsmith/selectors/tenantSelectors";
import {
  getFilteredAclCategories,
  getFilteredGeneralCategories,
  getFilteredOtherCategories,
} from "@appsmith/utils/adminSettingsHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasAuditLogsReadPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";

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
    gap: 12px;
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
  const categories = getSettingsCategory(CategoryType.GENERAL);
  const aclCategories = getSettingsCategory(CategoryType.ACL);
  const othersCategories = getSettingsCategory(CategoryType.OTHER);
  const { category, selected: subCategory } = useParams() as any;
  const user = useSelector(getCurrentUser);
  const isSuperUser = user?.isSuperUser;
  const tenantPermissions = useSelector(getTenantPermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isAuditLogsEnabled = getHasAuditLogsReadPermission(
    isFeatureEnabled,
    tenantPermissions,
  );

  const filteredGeneralCategories = getFilteredGeneralCategories(categories);

  const filteredAclCategories = getFilteredAclCategories(
    aclCategories,
    isSuperUser,
  );

  const filteredOthersCategories = getFilteredOtherCategories(
    othersCategories,
    isSuperUser,
  );

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
