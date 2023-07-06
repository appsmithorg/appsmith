import React, { memo, useCallback, useEffect, useState } from "react";
import { Bold, ErrorMessage, SelectWrapper } from "../../styles";
import { useDatasource } from "./useDatasource";
import {
  Icon,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuGroupName,
  Text,
  MenuItem,
  MenuSeparator,
  SearchInput,
} from "design-system";
import { DropdownOption, LoadMoreOptions } from "./DropdownOption";
import styled from "styled-components";
import type { DropdownOptionType } from "../../types";
import {
  DATASOURCE_DROPDOWN_SECTIONS,
  DEFAULT_QUERY_OPTIONS_COUNTS_TO_SHOW,
} from "../../constants";

const StyledDropdownTrigger = styled.div<{
  isDisabled: boolean;
  isValid: boolean;
}>`
  width: 100%;
  border: 1px solid
    var(
      ${(props) =>
        props.isValid ? "--ads-v2-color-border" : "--ads-v2-color-fg-error"}
    );
  border-radius: var(--ads-v2-border-radius);
  box-sizing: border-box;
  padding: 7px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: ${(props) => (props.isDisabled ? "default" : "pointer")};
  ${(props) => (props.isDisabled ? "pointer-events: none;" : "")}

  &:hover {
    border-color: var(--ads-v2-color-gray-400);
  }

  &:active,
  &:focus {
    border-color: var(--ads-v2-color-gray-600);
  }

  & .selected-item {
    width: calc(100% - 16px);
  }
`;

const StyledMenuSeparator = styled(MenuSeparator)`
  margin: 10px 0px;
`;

const StyledInputContainer = styled.div`
  padding: 10px 8px;
`;

const StyledMenuGroupName = styled(MenuGroupName)`
  margin-bottom: 5px;
`;

const StyledMenuContent = styled(MenuContent)`
  width: 350px;
  max-width: 350px;
`;

function DatasourceDropdown() {
  const [searchText, setSearchText] = useState("");

  const {
    datasourceOptions,
    disabled,
    error,
    isSourceOpen,
    onSourceClose,
    otherOptions,
    queryOptions,
    selected,
  } = useDatasource(searchText);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(isSourceOpen);
  }, [isSourceOpen]);

  const [showMoreQueries, setShowMoreQueries] = useState(false);

  const [showMoreDataSources, setShowMoreDataSources] = useState(false);

  const onChange = useCallback((value: string) => setSearchText(value), []);

  return (
    <SelectWrapper data-testId="t--one-click-binding-datasource-selector">
      <Menu
        onOpenChange={(open: boolean) => {
          setOpen(open);
          onSourceClose();
        }}
        open={open}
      >
        <MenuTrigger>
          <StyledDropdownTrigger
            data-testId="t--one-click-binding-datasource-trigger"
            isDisabled={disabled}
            isValid={!error}
          >
            <div className="selected-item">{selected}</div>
            <div>
              <Icon name="arrow-down-s-line" size="md" />
            </div>
          </StyledDropdownTrigger>
        </MenuTrigger>
        <StyledMenuContent align="end">
          <div
            onKeyDown={(e) => {
              // This is to prevent the Menu component to take focus away from the input
              // https://github.com/radix-ui/primitives/issues/1175
              e.stopPropagation();
            }}
          >
            <StyledInputContainer>
              <SearchInput
                autoFocus
                data-testId="t--one-click-binding-datasource--search"
                onChange={onChange}
                size="md"
                type="text"
                value={searchText}
              />
            </StyledInputContainer>

            {!!queryOptions.length && (
              <StyledMenuGroupName data-testId="t--one-click-binding-datasource-selector--bind-to-query">
                <Text kind="heading-xs">
                  {DATASOURCE_DROPDOWN_SECTIONS.CONNECT_TO_QUERY}
                </Text>
              </StyledMenuGroupName>
            )}

            {queryOptions
              .slice(
                0,
                showMoreQueries
                  ? queryOptions.length
                  : DEFAULT_QUERY_OPTIONS_COUNTS_TO_SHOW,
              )
              .map((option) => {
                return (
                  <MenuItem
                    data-testId="t--one-click-binding-datasource-selector--query"
                    key={option.id}
                    onSelect={() => {
                      option.onSelect(option.value, option);
                      onSourceClose();
                      setOpen(false);
                    }}
                  >
                    <DropdownOption
                      label={option.label}
                      leftIcon={option.icon}
                    />
                  </MenuItem>
                );
              })}

            {!showMoreQueries && (
              <LoadMoreOptions
                count={queryOptions.length}
                onLoadMore={() => {
                  setShowMoreQueries(true);
                }}
              />
            )}

            {!!queryOptions.length &&
              (!!datasourceOptions.length || !!otherOptions.length) && (
                <StyledMenuSeparator />
              )}

            {!!datasourceOptions.length && (
              <StyledMenuGroupName data-testid="t--one-click-binding-datasource-selector--generate-a-query">
                <Text kind="heading-xs">
                  {DATASOURCE_DROPDOWN_SECTIONS.CHOOSE_DATASOURCE_TO_CONNECT}
                </Text>
              </StyledMenuGroupName>
            )}

            {datasourceOptions
              .slice(
                0,
                showMoreDataSources
                  ? datasourceOptions.length
                  : DEFAULT_QUERY_OPTIONS_COUNTS_TO_SHOW,
              )
              .map((option) => {
                return (
                  <MenuItem
                    data-testId="t--one-click-binding-datasource-selector--datasource"
                    key={option.id}
                    onSelect={() => {
                      option?.onSelect?.(option.value || "", option);
                      onSourceClose();
                      setOpen(false);
                    }}
                  >
                    <DropdownOption
                      label={
                        <span>
                          {option.data.isSample ? "sample " : ""}
                          <Bold>{option.label?.replace("sample ", "")}</Bold>
                        </span>
                      }
                      leftIcon={option.icon}
                      rightIcon={<Icon name="add-box-line" size="md" />}
                    />
                  </MenuItem>
                );
              })}

            {!showMoreDataSources && (
              <LoadMoreOptions
                count={datasourceOptions.length}
                onLoadMore={() => {
                  setShowMoreDataSources(true);
                }}
              />
            )}

            {!!datasourceOptions.length && !!otherOptions.length && (
              <StyledMenuSeparator />
            )}

            {!!otherOptions.length && (
              <StyledMenuGroupName data-testid="t--one-click-binding-datasource-selector--other-actions">
                <Text kind="heading-xs">
                  {DATASOURCE_DROPDOWN_SECTIONS.OTHER_ACTIONS}
                </Text>
              </StyledMenuGroupName>
            )}

            {otherOptions.map((option: DropdownOptionType) => {
              return (
                <MenuItem
                  data-testId="t--one-click-binding-datasource-selector--other-action"
                  key={option.id}
                  onSelect={() => {
                    option.onSelect?.(option.value || "", option);
                    onSourceClose();
                    setOpen(false);
                  }}
                >
                  <DropdownOption label={option.label} leftIcon={option.icon} />
                </MenuItem>
              );
            })}
          </div>
        </StyledMenuContent>
      </Menu>
      <ErrorMessage>{error}</ErrorMessage>
    </SelectWrapper>
  );
}

export default memo(DatasourceDropdown);
