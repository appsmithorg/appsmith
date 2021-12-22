import { Colors } from "constants/Colors";
import { getAdminSettingsCategoryUrl } from "constants/routes";
import React from "react";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { SettingsFactory } from "./SettingsConfig";

const Wrapper = styled.div`
  flex-basis: ${(props) =>
    props.theme.homePage.leftPane.width +
    props.theme.homePage.leftPane.leftPadding}px;
  padding: 0px 0px 0px ${(props) => props.theme.homePage.leftPane.leftPadding}px;
`;

const HeaderContainer = styled.div``;

const StyledHeader = styled.div`
  font-size: 20px;
  text-transform: capitalize;
  margin: 40px 16px 16px;
  color: ${Colors.MASALA};
`;

const CategoryList = styled.ul`
  margin: 0;
  padding: 0;
  list-style-type: none;
`;

const Category = styled.li``;

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
  return Array.from(SettingsFactory.categories)
    .map((setting: string) => {
      return {
        label: setting.replace(/-/g, " "),
        slug: setting,
      };
    })
    .sort((a, b) => {
      if (a.label == "general") return -1;
      else if (b.label == "general") return 1;
      if (a.label == "advanced") return 1;
      else if (b.label == "advanced") return -1;
      return a.label < b.label ? -1 : 1;
    });
}

export default function LeftPane() {
  const categories = useSettingsCategory();
  const { category } = useParams() as any;
  return (
    <Wrapper>
      <HeaderContainer>
        <StyledHeader>Appsmith Admin</StyledHeader>
      </HeaderContainer>
      <CategoryList className="t--settings-category-list">
        {categories.map((config) => (
          <Category key={config.slug}>
            <StyledLink
              $active={category == config.slug}
              className={`t--settings-category-${config.slug}`}
              to={getAdminSettingsCategoryUrl(config.slug)}
            >
              {config.label}
            </StyledLink>
          </Category>
        ))}
      </CategoryList>
    </Wrapper>
  );
}
