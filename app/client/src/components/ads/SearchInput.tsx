import React, {
  forwardRef,
  Ref,
  useCallback,
  useRef,
  useState,
  useEffect,
} from "react";
import { CommonComponentProps, Classes } from "./common";
import styled from "styled-components";
import Icon, { IconSize } from "./Icon";
import TextInput from "./TextInput";
import { IconNames } from "@blueprintjs/icons";

export enum SearchVariant {
  BACKGROUND = "BACKGROUND",
  SEAMLESS = "SEAMLESS",
}

export type TextInputProps = CommonComponentProps & {
  border?: boolean;
  placeholder?: string;
  fill?: boolean;
  defaultValue?: string;
  variant?: SearchVariant;
  width?: string;
  onChange?: (value: string) => void;
};

const SearchInputWrapper = styled.div<{ border?: boolean }>`
  & > div {
    border: none;

    & > .left-icon {
      margin-left: 8px;

      & span {
        margin-right: 0;
      }
    }

    & > .right-icon {
      position: relative;
      right: 0;
    }

    & input {
      padding: 0 8px;
    }

    ${({ border }) =>
      border &&
      `
      border: 1.2px solid var(--appsmith-search-input-mobile-border-color);

      &:active, &:focus, &:hover {
        border-color: var(--appsmith-search-input-focus-mobile-border-color);
      }
    `}
  }
`;

const CloseIcon = styled.div`
  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[4]}px;
    margin-left: 0;
  }
`;

const SearchInput = forwardRef(
  (props: TextInputProps, ref: Ref<HTMLInputElement>) => {
    const [searchValue, setSearchValue] = useState(props.defaultValue);
    useEffect(() => {
      setSearchValue(props.defaultValue);
    }, [props.defaultValue]);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const memoizedChangeHandler = useCallback(
      (value) => {
        setSearchValue(value);
        return props.onChange && props.onChange(value);
      },
      [props],
    );

    const memoizedClearHandler = useCallback(() => {
      setSearchValue("");
      if (wrapperRef) {
        const inputElem = wrapperRef.current?.getElementsByTagName("input");
        if (inputElem && inputElem.length > 0) {
          inputElem[0].value = "";
        }
      }
      return props.onChange && props.onChange("");
    }, [props]);
    return (
      <SearchInputWrapper border={props.border} ref={wrapperRef}>
        <TextInput
          {...props}
          defaultValue={searchValue}
          height="38px"
          leftIcon={IconNames.SEARCH}
          noBorder={props.variant === SearchVariant.SEAMLESS}
          onChange={memoizedChangeHandler}
          ref={ref}
          rightSideComponent={
            searchValue && props.variant === SearchVariant.BACKGROUND ? (
              <CloseIcon>
                <Icon
                  name="close"
                  onClick={memoizedClearHandler}
                  size={IconSize.MEDIUM}
                />
              </CloseIcon>
            ) : null
          }
          width={props.width ? props.width : "228px"}
        />
      </SearchInputWrapper>
    );
  },
);

SearchInput.defaultProps = {
  fill: false,
};

SearchInput.displayName = "SearchInput";

export default SearchInput;
