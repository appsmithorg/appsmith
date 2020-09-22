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
`;

const SearchIcon = styled.div<{
  value?: string;
  isFocused: boolean;
}>`
  .${Classes.ICON} {
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
`;

const CloseIcon = styled.div`
  .${Classes.ICON} {
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
        data-cy={props.cypressSelector}
        value={searchValue}
        isFocused={isFocused}
        variant={props.variant}
        fill={props.fill}
      >
        <SearchIcon value={searchValue} isFocused={isFocused}>
          <Icon name="search" size={IconSize.SMALL} />
        </SearchIcon>
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
          <CloseIcon>
            <Icon
              name="close"
              size={IconSize.MEDIUM}
              onClick={() => setSearchValue("")}
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
