import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import AdminConfig from "@appsmith/pages/AdminSettings/config";
import {
  CategoryType,
  type Category,
} from "@appsmith/pages/AdminSettings/config/types";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import { useParams } from "react-router";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Icon, Tag, Text } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getCurrentUser } from "selectors/usersSelectors";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import {
  BUSINESS_TAG,
  ENTERPRISE_TAG,
  createMessage,
} from "@appsmith/constants/messages";

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
  display: flex;
  gap: 12px;
  align-items: center;

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

export function getSettingsCategory(type: string) {
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

  const onClickHandler = (category: string, needsUpgrade: boolean) => {
    if (category === "general") {
      dispatch({
        type: ReduxActionTypes.FETCH_ADMIN_SETTINGS,
      });
    }
    if (needsUpgrade) {
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
        return (
          <CategoryItem key={config.slug}>
            <StyledLink
              $active={active}
              className={`t--settings-category-${config.slug} ${
                active ? "active" : ""
              }`}
              onClick={() =>
                onClickHandler(config.slug, config?.needsUpgrade || false)
              }
              to={
                !parentCategory
                  ? adminSettingsCategoryUrl({ category: config.slug })
                  : adminSettingsCategoryUrl({
                      category: parentCategory.slug,
                      selected: config.slug,
                    })
              }
            >
              {config?.needsUpgrade ? (
                <Icon name="lock-2-line" />
              ) : (
                config?.icon && <Icon name={config?.icon} size="md" />
              )}
              <SettingName active={active}>{config.title}</SettingName>
              {config?.needsUpgrade && (
                <Tag isClosable={false}>
                  {createMessage(
                    config?.isEnterprise ? ENTERPRISE_TAG : BUSINESS_TAG,
                  )}
                </Tag>
              )}
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
  const featureFlags = useSelector(selectFeatureFlags);

  const filteredAclCategories = aclCategories
    ?.map((category) => {
      if (
        category.slug === "provisioning" &&
        !featureFlags.release_scim_provisioning_enabled
      ) {
        return null;
      }
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
            categories={categories}
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
      <HeaderContainer>
        <StyledHeader kind="heading-s" renderAs="p">
          Others
        </StyledHeader>
        <Categories
          categories={othersCategories}
          currentCategory={category}
          currentSubCategory={subCategory}
        />
      </HeaderContainer>
    </Wrapper>
  );
}
