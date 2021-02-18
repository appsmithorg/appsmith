// eslint-disable-next-line
import React, { useEffect, useCallback } from "react";
import { connectHits } from "react-instantsearch-dom";
import { Hit as IHit } from "react-instantsearch-core";
import { debounce } from "lodash";

const SearchResults = ({ hits, setDocumentationSearchResults }: any) => {
  const debounsedSetter = useCallback(
    debounce(setDocumentationSearchResults, 100),
    [],
  );

  useEffect(() => {
    debounsedSetter(hits);
  }, [hits]);

  return null;
};

export default connectHits<any, IHit>(SearchResults);
