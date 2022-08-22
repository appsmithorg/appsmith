import React, { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import { Text, TextType } from "design-system";
import { extraLibraries } from "utils/DynamicBindingUtils";
import { Button, Category, Size, TextInput } from "components/ads";
import Icon from "components/ads/AppIcon";
import { useDispatch, useSelector } from "react-redux";
import Entity from "./Entity";
import {
  createMessage,
  CREATE_DATASOURCE_TOOLTIP,
} from "ce/constants/messages";
import { AppState } from "reducers";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { debounce } from "lodash";

const Tag = styled.div<{ bgColor: string }>`
  background: ${(props) => props.bgColor};
  padding: 0 2px;
  font-size: 11px;
  color: white;
`;

const tagColors: any = {
  cdnjs: "#f86a2b",
  npm: "#03B364",
  default: "#393939",
  custom: "#fec518",
};

function JSDependencies() {
  const [results, setResults] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const defaultLibrariesNames = extraLibraries.map((lib) => lib.displayName);
  const installationQueue = useSelector(
    (state: AppState) => state.ui.applications.installationQueue,
  );
  const installedLibraries = useSelector(
    (state: AppState) => state.ui.applications.installedLibraries,
  );
  const isURL = useMemo(() => {
    try {
      new URL(search);
      return true;
    } catch (e) {
      return false;
    }
  }, [search]);
  const dependencyList = useMemo(
    () =>
      [...installationQueue, ...installedLibraries, ...extraLibraries].map(
        (lib) => {
          return (
            <div
              className="flex flex-col hover:bg-gray-100 w-full hover:cursor-pointer px-3 py-2"
              key={`${lib.name || lib.displayName}${lib.tag}`}
            >
              <div className="flex flex-row justify-between">
                <div className="flex flex-row items-start gap-1">
                  <Tag bgColor={tagColors[lib.tag]}>{lib.tag}</Tag>
                  <Text type={TextType.P4}>{lib.name || lib.displayName}</Text>
                </div>
                <Text type={TextType.P2}>{lib.version}</Text>
              </div>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                {lib.description}
              </span>
            </div>
          );
        },
      ),
    [installedLibraries, installationQueue],
  );

  const showDocs = React.useCallback((e?: any) => {
    window.open(
      "https://docs.appsmith.com/v/v1.2.1/core-concepts/writing-code/ext-libraries",
      "appsmith-docs:working-with-js-libraries",
    );
    e?.stopPropagation();
    e?.preventDefault();
  }, []);

  const searchResults = useMemo(
    () =>
      results.map((lib: any) => {
        return (
          <div
            className="flex flex-col hover:bg-gray-100 hover:cursor-pointer px-3 py-2"
            key={`${lib.name}${lib.tag}`}
            onClick={() => installLibrary(lib)}
          >
            <div className="flex flex-row justify-between">
              <div className="flex flex-row items-start gap-1">
                <Tag bgColor={tagColors[lib.tag]}>{lib.tag}</Tag>
                <Text type={TextType.P4}>{lib.name}</Text>
              </div>
              <Text type={TextType.P2}>{lib.version}</Text>
            </div>
            <Text type={TextType.P2}>{lib.description}</Text>
          </div>
        );
      }),
    [results],
  );

  const installLibrary = useCallback((lib) => {
    dispatch({ type: ReduxActionTypes.INSTALL_SCRIPT, payload: lib });
  }, []);

  // const TooltipContent = (
  //   <div>
  //     <span>Access these JS libraries to transform data within </span>
  //     <BindingText>{`{{ }}`}</BindingText>
  //     <span>. Try </span>
  //     <BindingText>{`{{ _.add(1,1) }}`}</BindingText>
  //   </div>
  // );

  const searchLibraries = useMemo(() => {
    return debounce(async function(val: string) {
      const [cdnCall, npmCall] = await Promise.all([
        fetch(
          `https://api.cdnjs.com/libraries?search=${val}&fields=name,latest,description,version&limit=10`,
        ),
        fetch(`https://api.npms.io/v2/search?q=${val}`),
      ]);
      const [cdnResults, npmCallResults] = await Promise.all([
        cdnCall.json(),
        npmCall.json(),
      ]);

      setSearch(val);
      setResults([
        ...(cdnResults.results || [])
          .filter(
            (lib: any) =>
              !defaultLibrariesNames.find((name) => lib.name.startsWith(name)),
          )
          .map((res: any) => {
            res.tag = "cdnjs";
            return res;
          }),
        ...(npmCallResults.results || [])
          .map((pack: any) => pack.package)
          .filter(
            (lib: any) =>
              !defaultLibrariesNames.find((name) => lib.name.startsWith(name)),
          )
          .map((res: any) => {
            res.tag = "npm";
            return res;
          }),
      ]);
    }, 100);
  }, []);

  return (
    <Entity
      addButtonHelptext={createMessage(CREATE_DATASOURCE_TOOLTIP)}
      customAddButton={
        <div
          className="flex flex-row items-center justify-center w-[30px] hover:text-gray-900"
          onClick={showDocs}
        >
          <Icon className="t--help-icon" name="help" size={Size.xxs} />
        </div>
      }
      entityId="dependencies_section"
      icon={null}
      isDefaultExpanded={false}
      isSticky
      name="LIBRARIES"
      searchKeyword={""}
      step={0}
    >
      <div className="flex flex-col py-2 px-3 overflow-auto">
        <TextInput
          height="28px"
          onChange={(val: string) => searchLibraries(val)}
          placeholder="Paste URL or search libraries from CDNJS and NPM"
          width="100%"
        />
      </div>
      {isURL ? (
        <Button
          category={Category.tertiary}
          className="mx-3"
          height="24"
          onClick={() => installLibrary(search)}
          text="Download and Install"
          type="button"
        />
      ) : searchResults.length && search ? (
        searchResults
      ) : (
        dependencyList
      )}
    </Entity>
  );
}

export default React.memo(JSDependencies);
