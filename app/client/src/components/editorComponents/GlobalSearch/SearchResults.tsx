import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Highlight, connectHits } from "react-instantsearch-dom";
import { Hit as IHit } from "react-instantsearch-core";
import "instantsearch.css/themes/algolia.css";
import { HelpBaseURL } from "constants/HelpConstants";
import { setHelpResults } from "actions/globalSearchActions";
import { AppState } from "reducers";

import styled from "styled-components";

type HitProps = {
  activeItemIndex: number;
  hit: IHit;
  index: number;
};

const HitContainer = styled.div<{ activeItem: boolean }>`
  background-color: ${(props) => (props.activeItem ? "grey" : "white")};
  color: black;
`;

const Hit = (props: HitProps) => {
  const { hit, activeItemIndex, index } = props;

  return (
    <HitContainer
      className="t--docHit"
      onClick={() => {
        window.open(props.hit.path.replace("master", HelpBaseURL), "_blank");
      }}
      activeItem={activeItemIndex === index}
    >
      <div className="hit-name t--docHitTitle">
        <Highlight attribute="title" hit={hit} />
      </div>
    </HitContainer>
  );
};

const Hits = ({ hits }: { hits: Array<IHit> }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setHelpResults(hits));
  }, [hits]);

  const { helpResults, activeItemIndex } = useSelector(
    (state: AppState) => state.ui.globalSearch,
  );

  return (
    <div>
      {helpResults.map((hit, index) => (
        <Hit
          key={index}
          index={index}
          hit={hit}
          activeItemIndex={activeItemIndex}
        />
      ))}
    </div>
  );
};

export default connectHits(Hits);
