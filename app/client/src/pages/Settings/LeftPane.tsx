import { Colors } from "constants/Colors";
import { getAdminSettingsCategoryUrl } from "constants/routes";
import React from "react";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import AdminConfig from "./config";
import { Category } from "@appsmith/pages/AdminSettings/config/types";

const Wrapper = styled.div`
  flex-basis: ${(props) =>
    props.theme.homePage.leftPane.width +
    props.theme.homePage.leftPane.leftPadding}px;
  padding: 0px 0px 0px ${(props) => props.theme.homePage.leftPane.leftPadding}px;
`;

const HeaderContainer = styled.div``;

const StyledHeader = styled.div`
  font-size: 14px;
  height: 20px;
  line-height: 17px;
  letter-spacing: -0.24px;
  text-transform: uppercase;
  margin: 40px 16px 16px;
  color: ${Colors.MASALA};
`;

const CategoryList = styled.ul`
  margin: 0;
  padding: 0 0 0 16px;
  list-style-type: none;
`;

const CategoryItem = styled.li``;

const StyledLink = styled(Link)<{ $active: boolean }>`
  height: 38px;
  padding: 10px 16px;
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

function useSettingsCategory() {
  return Array.from(AdminConfig.categories);
}

function Categories({
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
                ? getAdminSettingsCategoryUrl(config.slug)
                : getAdminSettingsCategoryUrl(parentCategory.slug, config.slug)
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
  const categories = useSettingsCategory();
  const { category, subCategory } = useParams() as any;
  return (
    <Wrapper>
      <HeaderContainer>
        <StyledHeader>Appsmith Admin</StyledHeader>
      </HeaderContainer>
      <Categories
        categories={categories}
        currentCategory={category}
        currentSubCategory={subCategory}
      />
    </Wrapper>
  );
}
