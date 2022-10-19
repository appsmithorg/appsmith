import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SearchComponent } from "design-system";
import { ExplorerContext } from "./contexts/explorer";
import { noop } from "utils/AppsmithUtils";
import {
  FieldMatch,
  getSearchResults,
  SearchResultType,
  TypeMatch,
  renderType,
} from "./utils";
import { debounce } from "lodash";
import { isInputObjectType, isInterfaceType, isObjectType } from "graphql";
import {
  SearchResultWrapper,
  SearchWrapper,
  SearchResultDivider,
  FieldLinkSearchWrapper,
  TypeLinkSearchWrapper,
  ArgumentSearchWrapper,
  SearchItem,
  SearchNoResult,
} from "./css";

type SearchType = {
  schema: any;
};

const INIT_RESULT = {
  within: [],
  fields: [],
  types: [],
};

const Search = (props: SearchType) => {
  const ref = useRef<HTMLDivElement>(null);
  const { stack = [], push = noop } = useContext(ExplorerContext) || {};
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultType>(INIT_RESULT);

  const stackItem = stack[stack.length - 1];

  const debouncedSearchResults = useMemo(
    () =>
      debounce(function(search: string) {
        setResults(getSearchResults(props.schema, search, stackItem));
        setLoading(false);
      }, 200),
    [getSearchResults, props.schema, stackItem],
  );

  const handleOutsideClick = useCallback((e: MouseEvent) => {
    // Check if the clicked element has the `ref` element in the path(i.e parent list).
    if (ref && !e.composedPath().includes(ref?.current as EventTarget)) {
      setSearchValue("");
      setResults(INIT_RESULT);
    }
  }, []);

  const onClickSearchItem: any = useCallback(
    (value: any) => () => {
      if (value) {
        setSearchValue("");
        setResults(INIT_RESULT);
        const def = (value as unknown) as TypeMatch | FieldMatch;
        push(
          "field" in def
            ? { name: def.field.name, def: def.field }
            : { name: def.type.name, def: def.type },
        );
      }
    },
    [],
  );

  useEffect(() => {
    debouncedSearchResults(searchValue);
  }, [debouncedSearchResults, searchValue]);

  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const shouldSearchBoxAppear =
    stack.length === 1 ||
    isObjectType(stackItem.def) ||
    isInterfaceType(stackItem.def) ||
    isInputObjectType(stackItem.def);

  return shouldSearchBoxAppear ? (
    <SearchWrapper ref={ref}>
      <SearchComponent
        onSearch={(value: any) => {
          setLoading(true);
          setSearchValue(value);
        }}
        placeholder="Search..."
        value={searchValue}
      />
      {searchValue.length > 0 && !loading && (
        <SearchResultWrapper>
          {results.within.map((result, i) => (
            <SearchItem key={`within-${i}`} onClick={onClickSearchItem(result)}>
              <Field argument={result.argument} field={result.field} />
            </SearchItem>
          ))}
          {results.within.length > 0 &&
          results.types.length + results.fields.length > 0 ? (
            <SearchResultDivider>
              <span>Other results</span>
            </SearchResultDivider>
          ) : null}
          {results.types.map((result, i) => (
            <SearchItem key={`type-${i}`} onClick={onClickSearchItem(result)}>
              <Type type={result.type} />
            </SearchItem>
          ))}
          {results.fields.map((result, i) => (
            <SearchItem key={`field-${i}`} onClick={onClickSearchItem(result)}>
              <Type type={result.type} />.
              <Field argument={result.argument} field={result.field} />
            </SearchItem>
          ))}
          {results.within.length +
            results.types.length +
            results.fields.length ===
          0 ? (
            <SearchItem>
              <SearchNoResult>No results found</SearchNoResult>
            </SearchItem>
          ) : null}
        </SearchResultWrapper>
      )}
    </SearchWrapper>
  ) : null;
};

function Type(props: TypeMatch) {
  return <TypeLinkSearchWrapper>{props.type.name}</TypeLinkSearchWrapper>;
}

function Field(props: Partial<FieldMatch>) {
  return (
    <>
      <FieldLinkSearchWrapper>{props.field?.name}</FieldLinkSearchWrapper>
      {props.argument ? (
        <>
          (<ArgumentSearchWrapper>{props.argument.name}</ArgumentSearchWrapper>:{" "}
          {renderType(props.argument.type, (namedType) => (
            <Type type={namedType} />
          ))}
          )
        </>
      ) : null}
    </>
  );
}

export default memo(Search);
