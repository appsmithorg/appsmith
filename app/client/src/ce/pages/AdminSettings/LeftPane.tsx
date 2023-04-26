import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import AdminConfig from "@appsmith/pages/AdminSettings/config";
import type { Category } from "@appsmith/pages/AdminSettings/config/types";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import { useParams } from "react-router";
import { createMessage, UPGRADE } from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import camelCase from "lodash/camelCase";
import { Icon } from "design-system";

export const Wrapper = styled.div`
  flex-basis: ${(props) =>
    props.theme.homePage.leftPane.width +
    props.theme.homePage.leftPane.leftPadding}px;
  padding: 0 0 0 ${(props) => props.theme.homePage.leftPane.leftPadding}px;
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
  margin: 0 12px;
`;

export const StyledHeader = styled.div`
  font-size: 16px;
  height: 20px;
  line-height: 1.5;
  letter-spacing: -0.24px;
  margin: 8px 16px 8px;
  color: var(--ads-v2-color-fg);
  font-weight: 500;
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
  font-weight: ${(props) => (props.$active ? 500 : 400)};
  text-transform: capitalize;
  display: flex;
  gap: 12px;

  && {
    color: var(--ads-v2-color-fg);
  }
  &:hover {
    text-decoration: none;
    background-color: var(--ads-v2-color-bg-subtle);
  }

  & div {
    align-self: center;
  }
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
  return (
    <CategoryList className="t--settings-category-list">
      {categories?.map((config) => (
        <CategoryItem key={config.slug}>
          <StyledLink
            $active={
              !!currentSubCategory && showSubCategory
                ? currentSubCategory == config.slug
                : currentCategory == config.slug
            }
            className={`t--settings-category-${config.slug}`}
            to={
              !parentCategory
                ? adminSettingsCategoryUrl({ category: config.slug })
                : adminSettingsCategoryUrl({
                    category: parentCategory.slug,
                    selected: config.slug,
                  })
            }
          >
            <div>{config?.icon && <Icon name={config?.icon} size="md" />}</div>
            <div>{config.title}</div>
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
      ))}
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
        <StyledHeader>Admin Settings</StyledHeader>
        <Categories
          categories={categories}
          currentCategory={category}
          currentSubCategory={subCategory}
        />
      </HeaderContainer>
      <HeaderContainer>
        <StyledHeader>Business</StyledHeader>
        <CategoryList data-testid="t--enterprise-settings-category-list">
          <CategoryItem>
            <StyledLink
              $active={category === "access-control"}
              data-testid="t--enterprise-settings-category-item-access-control"
              to="/settings/access-control"
            >
              <div>
                <Icon name="lock-2-line" size="md" />
              </div>
              <div>Access Control</div>
            </StyledLink>
          </CategoryItem>
          <CategoryItem>
            <StyledLink
              $active={category === "audit-logs"}
              data-testid="t--enterprise-settings-category-item-audit-logs"
              onClick={() => triggerAnalytics("AuditLogs")}
              to="/settings/audit-logs"
            >
              <div>
                <Icon name="lock-2-line" size="md" />
              </div>
              <div>Audit logs</div>
            </StyledLink>
          </CategoryItem>
          <CategoryItem>
            <StyledLink
              $active={category === "business-edition"}
              data-testid="t--enterprise-settings-category-item-be"
              onClick={() => triggerAnalytics("BusinessEdition")}
              to="/settings/business-edition"
            >
              <div>
                <Icon name="arrow-up-line" size="md" />
              </div>
              <div>{camelCase(createMessage(UPGRADE))}</div>
            </StyledLink>
          </CategoryItem>
        </CategoryList>
      </HeaderContainer>
    </Wrapper>
  );
}
