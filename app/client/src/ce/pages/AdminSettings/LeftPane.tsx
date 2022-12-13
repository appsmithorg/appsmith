import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import AdminConfig from "@appsmith/pages/AdminSettings/config";
import { Category } from "@appsmith/pages/AdminSettings/config/types";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import { useParams } from "react-router";
import { Icon, IconSize } from "design-system";
import { createMessage } from "design-system/build/constants/messages";
import { USAGE_AND_BILLING } from "@appsmith/constants/messages";
import { useSelector } from "react-redux";
import { selectFeatureFlags } from "selectors/usersSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";

export const Wrapper = styled.div`
  flex-basis: ${(props) =>
    props.theme.homePage.leftPane.width +
    props.theme.homePage.leftPane.leftPadding}px;
  padding: 0 0 0 ${(props) => props.theme.homePage.leftPane.leftPadding}px;
  overflow-y: auto;
  border-right: 1px solid var(--appsmith-color-black-200);
  flex-shrink: 0;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const HeaderContainer = styled.div`
  border-top: 1px solid var(--appsmith-color-black-200);
  padding: 20px 0;
  margin: 0 12px;
`;

export const StyledHeader = styled.div`
  font-size: 16px;
  height: 20px;
  line-height: 1.5;
  letter-spacing: -0.24px;
  margin: 8px 16px 8px;
  color: var(--appsmith-color-black-900);
  font-weight: 500;
`;

export const CategoryList = styled.ul`
  margin: 0;
  padding: 0 0 0 16px;
  list-style-type: none;
`;

export const CategoryItem = styled.li`
  width: 90%;
`;

export const StyledLink = styled(Link)<{ $active: boolean }>`
  height: 38px;
  padding: 8px 16px;
  background-color: ${(props) =>
    props.$active ? props.theme.colors.menuItem.hoverBg : ""};
  font-weight: ${(props) => (props.$active ? 500 : 400)};
  text-transform: capitalize;
  display: flex;
  gap: 12px;

  && {
    color: ${(props) =>
      props.$active
        ? props.theme.colors.menuItem.hoverText
        : props.theme.colors.menuItem.normalText};
  }
  &:hover {
    text-decoration: none;
    background-color: ${(props) => props.theme.colors.menuItem.hoverBg};
    color: ${(props) => props.theme.colors.menuItem.hoverText};
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
            <div>
              {config?.icon && <Icon name={config?.icon} size={IconSize.XL} />}
            </div>
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
  const features = useSelector(selectFeatureFlags);
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
          {features.RBAC && (
            <CategoryItem>
              <StyledLink
                $active={category === "access-control"}
                data-testid="t--enterprise-settings-category-item-access-control"
                to="/settings/access-control"
              >
                <div>
                  <Icon name="lock-2-line" size={IconSize.XL} />
                </div>
                <div>Access Control</div>
              </StyledLink>
            </CategoryItem>
          )}
          <CategoryItem>
            <StyledLink
              $active={category === "audit-logs"}
              data-testid="t--enterprise-settings-category-item-audit-logs"
              onClick={() => triggerAnalytics("AuditLogs")}
              to="/settings/audit-logs"
            >
              <div>
                <Icon name="lock-2-line" size={IconSize.XL} />
              </div>
              <div>Audit logs</div>
            </StyledLink>
          </CategoryItem>
          {features.USAGE && (
            <CategoryItem>
              <StyledLink
                $active={category === "usage"}
                data-testid="t--enterprise-settings-category-item-usage"
                onClick={() => triggerAnalytics("Usage")}
                to="/settings/usage"
              >
                <div>
                  <Icon name="lock-2-line" size={IconSize.XL} />
                </div>
                <div>{createMessage(USAGE_AND_BILLING.usage)}</div>
              </StyledLink>
            </CategoryItem>
          )}
        </CategoryList>
      </HeaderContainer>
    </Wrapper>
  );
}
