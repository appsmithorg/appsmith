import React, { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import { Text, TextType, TooltipComponent } from "design-system";
import { Colors } from "constants/Colors";
import { BindingText } from "pages/Editor/APIEditor/Form";
import { extraLibraries } from "utils/DynamicBindingUtils";
import { TextInput } from "components/ads";
import { useDispatch } from "react-redux";
import Entity from "./Entity";
import {
  createMessage,
  CREATE_DATASOURCE_TOOLTIP,
} from "ce/constants/messages";

const Wrapper = styled.div`
  font-size: 14px;
`;
const ListItem = styled.li`
  list-style: none;
  color: ${Colors.GREY_8};
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 0 12px 0 20px;
  position: relative;
  &:hover {
    background: ${Colors.ALABASTER_ALT};

    & .t--open-new-tab {
      display: block;
    }

    & .t--package-version {
      display: none;
    }
  }

  & .t--open-new-tab {
    position: absolute;
    right: 8px;
    display: none;
  }

  & .t--package-version {
    display: block;
  }
`;
const Name = styled.span``;
const Version = styled.span``;
const Title = styled.div`
  display: grid;
  grid-template-columns: 20px auto 20px;
  cursor: pointer;
  height: 32px;
  align-items: center;
  padding-right: 4px;
  padding-left: 0.25rem;
  font-size: 14px;
  &:hover {
    background: ${Colors.ALABASTER_ALT};
  }
  & .t--help-icon {
    svg {
      position: relative;
    }
  }
`;

const Tag = styled.div<{ bgColor: string }>`
  background: ${(props) => props.bgColor};
  padding: 0 2px;
  font-size: 11px;
  color: white;
`;

const tagColors: any = {
  cdnjs: "orange",
  npm: "green",
  default: "blue",
};

function JSDependencies() {
  const openDocs = (name: string, url: string) => () => window.open(url, name);
  const [results, setResults] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const defaultLibrariesNames = extraLibraries.map((lib) => lib.displayName);
  const dependencyList = useMemo(
    () =>
      extraLibraries.map((lib) => {
        return (
          <div
            className="flex flex-col hover:bg-gray-100 hover:cursor-pointer px-2 py-1"
            key={`${lib.displayName}${lib.tag}`}
            // onClick={() => openDocs(lib.displayName, lib.docsURL)}
          >
            <div className="flex flex-row justify-between">
              <div className="flex flex-row items-start gap-1">
                <Text type={TextType.P4}>{lib.displayName}</Text>
                <Tag bgColor={tagColors[lib.tag]}>{lib.tag}</Tag>
              </div>
              <Text type={TextType.P2}>{lib.version}</Text>
            </div>
            <Text type={TextType.P2}>{lib.description}</Text>
          </div>
        );
      }),
    [],
  );

  const searchResults = useMemo(
    () =>
      results.map((lib: any) => {
        return (
          <div
            className="flex flex-col hover:bg-gray-100 hover:cursor-pointer px-2 py-1"
            key={`${lib.name}${lib.tag}`}
            onClick={() => installLibrary(lib)}
          >
            <div className="flex flex-row justify-between">
              <div className="flex flex-row items-start gap-1">
                <Text type={TextType.P4}>{lib.name}</Text>
                <Tag bgColor={tagColors[lib.tag]}>{lib.tag}</Tag>
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
    const payload = lib.tag === "cdnjs" ? lib.latest : lib.name;
    dispatch({ type: "INSTALL_SCRIPT", payload });
  }, []);

  const showDocs = React.useCallback((e: any) => {
    window.open(
      "https://docs.appsmith.com/v/v1.2.1/core-concepts/writing-code/ext-libraries",
      "appsmith-docs:working-with-js-libraries",
    );
    e.stopPropagation();
    e.preventDefault();
  }, []);

  const TooltipContent = (
    <div>
      <span>Access these JS libraries to transform data within </span>
      <BindingText>{`{{ }}`}</BindingText>
      <span>. Try </span>
      <BindingText>{`{{ _.add(1,1) }}`}</BindingText>
    </div>
  );

  const searchLibraries = useMemo(() => {
    return async function(val: string) {
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
    };
  }, []);

  return (
    <Entity
      addButtonHelptext={createMessage(CREATE_DATASOURCE_TOOLTIP)}
      entityId="dependencies_section"
      icon={null}
      isDefaultExpanded={false}
      isSticky
      name="LIBRARIES"
      searchKeyword={""}
      step={0}
    >
      <div className="flex flex-col p-2 overflow-auto">
        <TextInput
          height="28px"
          onChange={(val: string) => searchLibraries(val)}
          placeholder="Paste URL or search libraries from CDNJS and NPM"
          width="100%"
        />
      </div>
      {searchResults.length && search ? searchResults : dependencyList}
    </Entity>
  );
}

export default React.memo(JSDependencies);
