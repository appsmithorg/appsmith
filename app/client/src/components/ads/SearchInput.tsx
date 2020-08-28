import React, {
  forwardRef,
  Ref,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";
import { CommonComponentProps } from "./common";
import styled from "styled-components";
import { Size } from "./Button";
import Icon from "./Icon";

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
  width: ${props =>
    props.value && props.variant === SearchVariant.BACKGROUND && props.isFocused
      ? "calc(100% - 50px)"
      : "100%"};
  border-radius: 0;
  outline: 0;
  box-shadow: none;
  border: none;
  padding: 0;
  background-color: transparent;
  font-size: ${props => props.theme.typography.p1.fontSize}px;
  font-weight: ${props => props.theme.typography.p1.fontWeight};
  line-height: ${props => props.theme.typography.p1.lineHeight}px;
  letter-spacing: ${props => props.theme.typography.p1.letterSpacing}px;
  text-overflow: ellipsis;

  color: ${props => props.theme.colors.blackShades[9]};

  &::placeholder {
    color: ${props => props.theme.colors.blackShades[5]};
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
  padding: ${props => props.theme.spaces[3]}px
    ${props => props.theme.spaces[4]}px ${props => props.theme.spaces[3]}px
    ${props => props.theme.spaces[6]}px;
  width: ${props => (props.fill ? "100%" : "210px")};
  background-color: ${props =>
    props.variant === SearchVariant.SEAMLESS ? "transparent" : "#262626"};
  ${props =>
    props.variant === SearchVariant.BACKGROUND
      ? props.isFocused || props.value
        ? `box-shadow: 0px 1px 0px ${props.theme.colors.info.main}`
        : `box-shadow: 0px 1px 0px ${props.theme.colors.blackShades[4]}`
      : null}

  .search-icon {
    margin-right: ${props => props.theme.spaces[5]}px;

    svg {
      path,
      circle {
        stroke: ${props =>
          props.isFocused || props.value
            ? props.theme.colors.blackShades[7]
            : props.theme.colors.blackShades[5]};
      }
    }
  }

  .close-icon {
    margin-right: ${props => props.theme.spaces[4]}px;
    margin-left: ${props => props.theme.spaces[4]}px;
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
      el => {
        setSearchValue(el.target.value);
        return props.onChange && props.onChange(el.target.value);
      },
      [props],
    );

    return (
      <InputWrapper
        value={searchValue}
        isFocused={isFocused}
        variant={props.variant}
        fill={props.fill}
      >
        <Icon name="search" size={Size.large} className="search-icon" />
        <StyledInput
          type="text"
          ref={ref}
          value={searchValue}
          isFocused={isFocused}
          {...props}
          placeholder={props.placeholder ? props.placeholder : ""}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={memoizedChangeHandler}
        />
        {searchValue && props.variant === SearchVariant.BACKGROUND ? (
          <Icon
            name="close"
            size={Size.large}
            className="close-icon"
            onClick={() => setSearchValue("")}
          />
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
