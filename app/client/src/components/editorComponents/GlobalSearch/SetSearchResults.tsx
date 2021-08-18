import { useEffect, useCallback } from "react";
import { connectHits } from "react-instantsearch-dom";
import { Hit as IHit } from "react-instantsearch-core";
import { debounce } from "lodash";
import { DocSearchItem, SearchItem, SEARCH_ITEM_TYPES } from "./utils";
import { SEARCH_CATEGORY_ID } from "./utils";

type Props = {
  setDocumentationSearchResults: (
    item: DocSearchItem | any,
    categoryId: SEARCH_CATEGORY_ID,
  ) => void;
  categoryId: SEARCH_CATEGORY_ID;
  hits: IHit[];
};

function SearchResults({
  categoryId,
  hits,
  setDocumentationSearchResults,
}: Props) {
  const debouncedSetter = useCallback(
    debounce(setDocumentationSearchResults, 100),
    [],
  );

  useEffect(() => {
    const filteredHits = hits.filter((doc: SearchItem) => {
      return categoryId === SEARCH_CATEGORY_ID.SNIPPETS
        ? doc.body && doc.body.hasOwnProperty("snippet")
        : doc.kind === SEARCH_ITEM_TYPES.document;
    });
    debouncedSetter(filteredHits as any, categoryId);
  }, [hits]);

  return null;
}

export default connectHits<Props, IHit>(SearchResults);
