import React, { useState, useMemo, useEffect } from "react";
import type { TreeDropdownOption } from "design-system-old";
import { TreeDropdown, TextInput } from "design-system-old";
import { debounce } from "lodash";
import { FIELD_CONFIG } from "../../Field/FieldConfig";
import { FieldType } from "../../constants";
import {
  flattenOptions,
  getCodeFromMoustache,
  getSelectedFieldFromValue,
  isEmptyBlock,
} from "../../utils";
import { getActionInfo } from "../ActionBlockTree/utils";
import type { SelectorViewProps } from "../../types";

function filterChildren(
  options: TreeDropdownOption[],
  searchText: string,
): TreeDropdownOption[] {
  return options.filter((option) => {
    const doesMatch = [option.label, option.value].some((val) =>
      val.toLowerCase().includes(searchText.toLowerCase()),
    );
    if (doesMatch) return true;
    if (option.children) {
      return filterChildren(option.children, searchText).length > 0;
    }
    return false;
  });
}

function sortOnChildrenLength(options: TreeDropdownOption[]) {
  return options.sort((a, b) => {
    return (a.children || []).length - (b.children || []).length;
  });
}

export const ActionSelectorView: React.FC<SelectorViewProps> = ({
  options,
  set,
  value,
}) => {
  const [isOpen, setOpen] = useState(isEmptyBlock(value));
  const [searchText, setSearchText] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const debouncedSetSearchText = useMemo(
    () => debounce(setDebouncedValue, 300),
    [],
  );

  useEffect(() => {
    setSearchText("");
  }, [isOpen]);

  const valueWithoutMoustache = getCodeFromMoustache(value);

  const selectedOption = getSelectedFieldFromValue(value, options);

  const fieldConfig = FIELD_CONFIG[FieldType.ACTION_SELECTOR_FIELD];

  const actionType = (selectedOption.type || selectedOption.value) as any;

  const { action } = getActionInfo(valueWithoutMoustache, actionType, true);

  useEffect(() => {
    debouncedSetSearchText(searchText);
  }, [searchText]);

  useEffect(() => {
    if (!isOpen) return;

    // Add timeout, to make sure the menu is rendered
    setTimeout(() => {
      function onIntersection(entries: IntersectionObserverEntry[]) {
        entries.forEach((entry) => {
          const childSubmenu = entry.target.querySelector(".bp3-overlay");
          if (childSubmenu) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            childSubmenu.style.visibility = entry.isIntersecting
              ? "visible"
              : "hidden";
          }
        });
      }

      const menuElements = document.querySelectorAll(
        ".action-selector-dropdown li.bp3-submenu",
      );

      menuElements.forEach((el) => {
        const observer = new IntersectionObserver(onIntersection, {
          root: document.querySelector(".action-selector-dropdown .bp3-menu"),
          threshold: 0,
        });

        observer.observe(el);
      });
    }, 100);
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!debouncedValue) return options;
    const optionsToFilter =
      debouncedValue.length >= 3 ? flattenOptions(options) : options;
    return sortOnChildrenLength(
      filterChildren(optionsToFilter, debouncedValue),
    );
  }, [debouncedValue]);

  return (
    <TreeDropdown
      className="right-8 action-selector-view"
      defaultOpen={isOpen}
      defaultText={(action || "").toString()}
      menuHeight={300}
      menuWidth={256}
      modifiers={{
        preventOverflow: {
          boundariesElement: "viewport",
        },
      }}
      onMenuToggle={(isOpen) => {
        setOpen(isOpen);
      }}
      onSelect={set}
      optionTree={filteredOptions}
      popoverClassName="action-selector-dropdown"
      position="bottom"
      selectedValue={fieldConfig.getter(valueWithoutMoustache)}
      toggle={
        isOpen ? (
          <TextInput
            autoFocus
            className="w-full"
            onChange={(val: string) => setSearchText(val)}
            value={searchText}
          />
        ) : null
      }
      usePortal={false}
    />
  );
};
