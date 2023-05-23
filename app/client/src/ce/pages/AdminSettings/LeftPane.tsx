import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import AdminConfig from "@appsmith/pages/AdminSettings/config";
import type { Category } from "@appsmith/pages/AdminSettings/config/types";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import { useParams } from "react-router";
import { createMessage, UPGRADE } from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Icon, Text } from "design-system";
import { useDispatch } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const Wrapper = styled.div`
  flex-basis: ${(props) => props.theme.sidebarWidth};
  overflow-y: auto;
  border-right: 1px solid var(--ads-v2-color-border);
  flex-shrink: 0;

  &::-webkit-scrollbar {
    display: none;
  }

  > div:not(:first-child) {
    border-top: 1px solid var(--ads-v2-color-border);
  }
`;

export const HeaderContainer = styled.div`
  padding: 20px 0;
  margin: 0 16px;
`;

export const StyledHeader = styled(Text)`
  height: 20px;
  margin: 8px 16px 8px;
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
  height: 38px;
  padding: 8px 16px;
  border-radius: var(--ads-v2-border-radius);
  background-color: ${(props) =>
    props.$active ? `var(--ads-v2-color-bg-muted)` : ""};
  display: flex;
  gap: 12px;

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

export function getSettingsCategory() {
  return Array.from(AdminConfig.categories);
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

  const onClickHandler = (category: string) => {
    if (category === "general") {
      dispatch({
        type: ReduxActionTypes.FETCH_ADMIN_SETTINGS,
      });
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
              onClick={() => onClickHandler(config.slug)}
              to={
                !parentCategory
                  ? adminSettingsCategoryUrl({ category: config.slug })
                  : adminSettingsCategoryUrl({
                      category: parentCategory.slug,
                      selected: config.slug,
                    })
              }
            >
              {config?.icon && <Icon name={config?.icon} size="md" />}
              <SettingName active={active}>{config.title}</SettingName>
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
  const categories = getSettingsCategory();
  const { category, selected: subCategory } = useParams() as any;

  function triggerAnalytics(source: string) {
    AnalyticsUtil.logEvent("ADMIN_SETTINGS_CLICK", {
      source,
    });
  }

  return (
    <Wrapper>
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
      <HeaderContainer>
        <StyledHeader kind="heading-s" renderAs="p">
          Business
        </StyledHeader>
        <CategoryList data-testid="t--enterprise-settings-category-list">
          <CategoryItem>
            <StyledLink
              $active={category === "access-control"}
              className={`${category === "access-control" ? "active" : ""}`}
              data-testid="t--enterprise-settings-category-item-access-control"
              to="/settings/access-control"
            >
              <Icon name="lock-2-line" size="md" />
              <SettingName active={category === "access-control"}>
                Access control
              </SettingName>
            </StyledLink>
          </CategoryItem>
          <CategoryItem>
            <StyledLink
              $active={category === "audit-logs"}
              className={`${category === "audit-logs" ? "active" : ""}`}
              data-testid="t--enterprise-settings-category-item-audit-logs"
              onClick={() => triggerAnalytics("AuditLogs")}
              to="/settings/audit-logs"
            >
              <Icon name="lock-2-line" size="md" />
              <SettingName active={category === "audit-logs"}>
                Audit logs
              </SettingName>
            </StyledLink>
          </CategoryItem>
          <CategoryItem>
            <StyledLink
              $active={category === "business-edition"}
              className={`${category === "business-edition" ? "active" : ""}`}
              data-testid="t--enterprise-settings-category-item-be"
              onClick={() => triggerAnalytics("BusinessEdition")}
              to="/settings/business-edition"
            >
              <Icon name="arrow-up-line" size="md" />
              <SettingName active={category === "business-edition"}>
                {createMessage(UPGRADE)}
              </SettingName>
            </StyledLink>
          </CategoryItem>
        </CategoryList>
      </HeaderContainer>
    </Wrapper>
  );
}
