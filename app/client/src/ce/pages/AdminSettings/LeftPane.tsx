import React from "react";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import AdminConfig from "./config";
import { Category } from "@appsmith/pages/AdminSettings/config/types";
import { adminSettingsCategoryUrl } from "RouteBuilder";

export const Wrapper = styled.div`
  flex-basis: ${(props) =>
    props.theme.homePage.leftPane.width +
    props.theme.homePage.leftPane.leftPadding}px;
  padding: 0px 0px 0px ${(props) => props.theme.homePage.leftPane.leftPadding}px;
`;

export const HeaderContainer = styled.div``;

export const StyledHeader = styled.div`
  font-size: 16px;
  height: 20px;
  line-height: 1.5;
  letter-spacing: -0.24px;
  margin: 40px 16px 8px;
  color: var(--appsmith-color-black-900);
  font-weight: 500;
`;

export const CategoryList = styled.ul`
  margin: 0;
  padding: 0 0 0 16px;
  list-style-type: none;
`;

export const CategoryItem = styled.li``;

export const StyledLink = styled(Link)<{ $active: boolean }>`
  height: 38px;
  padding: 8px 16px;
  display: block;
  background-color: ${(props) =>
    props.$active ? props.theme.colors.menuItem.hoverBg : ""};
  font-weight: ${(props) => (props.$active ? 500 : 400)};
  text-transform: capitalize;
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
            {config.title}
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
    </Wrapper>
  );
}
