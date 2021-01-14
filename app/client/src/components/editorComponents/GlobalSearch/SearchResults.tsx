import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Highlight, connectHits } from "react-instantsearch-dom";
import { Hit as IHit } from "react-instantsearch-core";
import "instantsearch.css/themes/algolia.css";
import { HelpBaseURL } from "constants/HelpConstants";
import { setHelpResults } from "actions/globalSearchActions";
import { AppState } from "reducers";

const Hit = (props: { hit: { path: string } }) => {
  return (
    <div
      className="t--docHit"
      onClick={() => {
        window.open(props.hit.path.replace("master", HelpBaseURL), "_blank");
      }}
    >
      <div className="hit-name t--docHitTitle">
        <Highlight attribute="title" hit={props.hit} />
      </div>
    </div>
  );
};

const Hits = ({ hits }: { hits: Array<IHit> }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setHelpResults(hits));
  }, [hits]);

  const { helpResults } = useSelector(
    (state: AppState) => state.ui.globalSearch,
  );

  return (
    <>
      {helpResults.map((hit, index) => (
        <Hit key={index} hit={hit} />
      ))}
    </>
  );
};

export default connectHits(Hits);
