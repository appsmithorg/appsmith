// eslint-disable-next-line
import React, { useEffect } from "react";
import { connectHits } from "react-instantsearch-dom";
import { Hit as IHit } from "react-instantsearch-core";

const SearchResults = ({ hits, setDocumentationSearchResults }: any) => {
  useEffect(() => {
    setDocumentationSearchResults(hits);
  }, [hits]);

  return null;
};

export default connectHits<any, IHit>(SearchResults);
