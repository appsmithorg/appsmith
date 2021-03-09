import { useEffect, useCallback } from "react";
import { connectHits } from "react-instantsearch-dom";
import { Hit as IHit } from "react-instantsearch-core";
import { debounce } from "lodash";
import { DocSearchItem, SearchItem, SEARCH_ITEM_TYPES } from "./utils";

type Props = {
  setDocumentationSearchResults: (item: DocSearchItem) => void;
  hits: IHit[];
};

const SearchResults = ({ hits, setDocumentationSearchResults }: Props) => {
  const debounsedSetter = useCallback(
    debounce(setDocumentationSearchResults, 100),
    [],
  );

  useEffect(() => {
    const filteredHits = hits.filter(
      (doc: SearchItem) => doc.kind === SEARCH_ITEM_TYPES.document,
    );
    debounsedSetter(filteredHits as any);
  }, [hits]);

  return null;
};

export default connectHits<Props, IHit>(SearchResults);
