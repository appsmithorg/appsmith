import { useEffect, useCallback } from "react";
import { connectHits } from "react-instantsearch-dom";
import { Hit as IHit } from "react-instantsearch-core";
import { debounce } from "lodash";
import {
  DocSearchItem,
  SearchCategory,
  SearchItem,
  SEARCH_ITEM_TYPES,
} from "./utils";

type Props = {
  setSearchResults: (
    item: DocSearchItem | any,
    category?: SearchCategory,
  ) => void;
  category: SearchCategory;
  hits: IHit[];
};

function SearchResults({ category, hits, setSearchResults }: Props) {
  const debouncedSetter = useCallback(debounce(setSearchResults, 100), []);

  useEffect(() => {
    const filteredHits = hits.filter((doc: SearchItem) => {
      return !doc.kind || doc.kind === SEARCH_ITEM_TYPES.document;
    });
    debouncedSetter(filteredHits as any, category);
  }, [hits]);

  return null;
}

export default connectHits<Props, IHit>(SearchResults);
