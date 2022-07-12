import { debounce } from "lodash";
import { useState } from "react";

export function useSearchText(initialVal: string) {
  const [searchText, setSearchText] = useState(initialVal);

  const debouncedSetSearchText = debounce(
    (text) => {
      setSearchText(text.trim());
    },
    250,
    {
      maxWait: 1000,
    },
  );

  return { searchText, setSearchText: debouncedSetSearchText };
}
