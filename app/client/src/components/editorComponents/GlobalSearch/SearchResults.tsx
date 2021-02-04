import React, { useEffect } from "react";
import { Highlight, connectHits } from "react-instantsearch-dom";
import { Hit as IHit } from "react-instantsearch-core";
import "instantsearch.css/themes/algolia.css";
import { HelpBaseURL } from "constants/HelpConstants";
import styled, { withTheme } from "styled-components";
import Icon, { IconCollection, IconName, IconSize } from "components/ads/Icon";
import { Theme, getTypographyByKey } from "constants/DefaultTheme";

type HitProps = {
  activeItemIndex: number;
  hit: IHit;
  index: number;
  theme: Theme;
  setActiveItemIndex: (index: number) => void;
};

const HitContainer = styled.div<{ activeItem: boolean }>`
  [class^="ais-"] {
    ${(props) => getTypographyByKey(props, "p3")};
  }
  background-color: ${(props) =>
    props.activeItem
      ? props.theme.colors.globalSearch.activeSearchItemBackground
      : "unset"};
  display: flex;
  padding: ${(props) =>
    `${props.theme.spaces[3]}px ${props.theme.spaces[4]}px`};
  border-radius: ${(props) => props.theme.radii[2]}px;
  color: ${(props) => props.theme.colors.globalSearch.searchItemText};
  & .ais-Highlight-highlighted {
    background: unset;
    color: ${(props) => props.theme.colors.globalSearch.searchItemHighlight};
    font-style: normal;
    text-decoration: underline;
    text-decoration-color: ${(props) =>
      props.theme.colors.globalSearch.highlightedTextUnderline};
  }
  & .hit-name {
    margin-left: ${(props) => props.theme.spaces[5]}px;
  }
  margin-bottom: ${(props) => props.theme.spaces[1]}px;
`;

const Hit = withTheme((props: HitProps) => {
  const { hit, activeItemIndex, index, setActiveItemIndex } = props;

  return (
    <HitContainer
      onMouseEnter={() => setActiveItemIndex(index)}
      onClick={() => setActiveItemIndex(index)}
      className="t--docHit"
      activeItem={activeItemIndex === index}
    >
      <Icon
        name="link"
        size={IconSize.LARGE}
        fillColor={props.theme.colors.globalSearch.searchItemText}
        onClick={() => {
          window.open(props.hit.path.replace("master", HelpBaseURL), "_blank");
        }}
      />
      <div className="hit-name t--docHitTitle">
        <Highlight attribute="title" hit={hit} />
      </div>
    </HitContainer>
  );
});

type Props = {
  hits: Array<IHit>;
  searchResults: Array<any>;
  setSearchResults: (searchResults: Array<any>) => void;
  activeItemIndex: number;
  setActiveItemIndex: (index: number) => void;
};

const SearchResultsContainer = styled.div`
  padding: 0 ${(props) => props.theme.spaces[6]}px;
`;

const Hits = ({
  hits,
  searchResults,
  setSearchResults,
  activeItemIndex,
  setActiveItemIndex,
}: Props) => {
  useEffect(() => {
    setSearchResults(hits);
  }, [hits]);

  return (
    <SearchResultsContainer>
      {searchResults.map((hit, index) => (
        <Hit
          key={index}
          index={index}
          hit={hit}
          activeItemIndex={activeItemIndex}
          setActiveItemIndex={setActiveItemIndex}
        />
      ))}
    </SearchResultsContainer>
  );
};

export default connectHits<Props, IHit>(Hits);
