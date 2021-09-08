import React, {
  forwardRef,
  Ref,
  useCallback,
  useState,
  useEffect,
} from "react";
import { CommonComponentProps, Classes } from "./common";
import styled from "styled-components";
import Icon, { IconSize } from "./Icon";

export enum SearchVariant {
  BACKGROUND = "BACKGROUND",
  SEAMLESS = "SEAMLESS",
}

export type TextInputProps = CommonComponentProps & {
  placeholder?: string;
  fill?: boolean;
  defaultValue?: string;
  variant?: SearchVariant;
  onChange?: (value: string) => void;
};

const StyledInput = styled.input<
  TextInputProps & { value?: string; isFocused: boolean }
>`
  width: ${(props) =>
    props.value && props.variant === SearchVariant.BACKGROUND && props.isFocused
      ? "calc(100% - 50px)"
      : "100%"};
  border-radius: 0;
  outline: 0;
  box-shadow: none;
  border: none;
  padding: 0;
  background-color: transparent;
  font-size: ${(props) => props.theme.typography.p1.fontSize}px;
  font-weight: ${(props) => props.theme.typography.p1.fontWeight};
  line-height: ${(props) => props.theme.typography.p1.lineHeight}px;
  letter-spacing: ${(props) => props.theme.typography.p1.letterSpacing}px;
  text-overflow: ellipsis;

  color: ${(props) => props.theme.colors.searchInput.text};

  &::placeholder {
    color: ${(props) => props.theme.colors.searchInput.placeholder};
  }
`;

const InputWrapper = styled.div<{
  value?: string;
  isFocused: boolean;
  variant?: SearchVariant;
  fill?: boolean;
}>`
  display: flex;
  align-items: center;
  font-family: "SF Pro Text";
  padding: ${(props) => props.theme.spaces[3]}px
    ${(props) => props.theme.spaces[4]}px ${(props) => props.theme.spaces[3]}px
    ${(props) => props.theme.spaces[6]}px;
  width: ${(props) => (props.fill ? "100%" : "228px")};
  height: 38px;
  border: ${(props) =>
    props.variant === SearchVariant.SEAMLESS
      ? "0px"
      : `1.2px solid ${props.theme.colors.searchInput.border}`};
  background-color: ${(props) =>
    props.variant === SearchVariant.SEAMLESS
      ? "transparent"
      : props.theme.colors.searchInput.bg};
  ${(props) =>
    props.variant === SearchVariant.BACKGROUND
      ? props.isFocused || props.value
        ? `
        box-shadow: 0px 0px 4px 4px rgba(203, 72, 16, 0.18);
        border: 1px solid ${props.theme.colors.info.main};
        `
        : null
      : null}
`;

const SearchIcon = styled.div<{
  value?: string;
  isFocused: boolean;
}>`
  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[5]}px;

    svg {
      path,
      circle {
        stroke: ${(props) =>
          props.isFocused || props.value
            ? props.theme.colors.searchInput.icon.focused
            : props.theme.colors.searchInput.icon.normal};
        fill: transparent;
      }
    }
  }
`;

const CloseIcon = styled.div`
  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[4]}px;
    margin-left: ${(props) => props.theme.spaces[4]}px;
  }
`;

const SearchInput = forwardRef(
  (props: TextInputProps, ref: Ref<HTMLInputElement>) => {
    const [searchValue, setSearchValue] = useState(props.defaultValue);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      setSearchValue(props.defaultValue);
    }, [props.defaultValue]);

    const memoizedChangeHandler = useCallback(
      (el) => {
        setSearchValue(el.target.value);
        return props.onChange && props.onChange(el.target.value);
      },
      [props],
    );

    const inputProps = { ...props };
    delete inputProps.fill;
    delete inputProps.defaultValue;
    return (
      <InputWrapper
        data-cy={props.cypressSelector}
        fill={props.fill ? 1 : 0}
        isFocused={isFocused}
        value={searchValue}
        variant={props.variant}
      >
        <SearchIcon isFocused={isFocused} value={searchValue}>
          <Icon name="search" size={IconSize.SMALL} />
        </SearchIcon>
        <StyledInput
          {...inputProps}
          isFocused={isFocused}
          onBlur={() => setIsFocused(false)}
          onChange={memoizedChangeHandler}
          onFocus={() => setIsFocused(true)}
          placeholder={props.placeholder ? props.placeholder : ""}
          ref={ref}
          type="text"
          value={searchValue}
        />
        {searchValue && props.variant === SearchVariant.BACKGROUND ? (
          <CloseIcon>
            <Icon
              name="close"
              onClick={() => setSearchValue("")}
              size={IconSize.MEDIUM}
            />
          </CloseIcon>
        ) : null}
      </InputWrapper>
    );
  },
);

SearchInput.defaultProps = {
  fill: false,
};

SearchInput.displayName = "SearchInput";

export default SearchInput;
