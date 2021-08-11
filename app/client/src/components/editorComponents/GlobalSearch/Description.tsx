import React, { useEffect } from "react";
import styled from "styled-components";
import ActionLink from "./ActionLink";
import Highlight from "./Highlight";
import { algoliaHighlightTag, getItemTitle, SEARCH_ITEM_TYPES } from "./utils";
import { getTypographyByKey } from "constants/DefaultTheme";
import { SearchItem } from "./utils";
import parseDocumentationContent from "./parseDocumentationContent";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import javascript from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import pgsql from "react-syntax-highlighter/dist/esm/languages/hljs/pgsql";
import xcode from "react-syntax-highlighter/dist/esm/styles/hljs/xcode";
import { useState } from "react";
import { TabbedViewContainer } from "pages/Editor/APIEditor/Form";
import { TabComponent } from "components/ads/Tabs";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "../CodeEditor/EditorConfig";
import CodeEditor from "../CodeEditor";
import Button, { Size } from "components/ads/Button";
import { useDispatch } from "react-redux";
import { evaluateSnippet } from "actions/globalSearchActions";

SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("postgres", pgsql);

type Props = {
  activeItem: SearchItem;
  activeItemType?: SEARCH_ITEM_TYPES;
  query: string;
  scrollPositionRef: React.MutableRefObject<number>;
};

const Container = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
  margin-left: ${(props) => `${props.theme.spaces[4]}px`};
  background: white;
  padding: ${(props) =>
    `${props.theme.spaces[5]}px ${props.theme.spaces[7]}px 0`};
  color: ${(props) => props.theme.colors.globalSearch.searchItemText};
  overflow: auto;

  ${(props) => getTypographyByKey(props, "spacedOutP1")};
  [class^="ais-"] {
    ${(props) => getTypographyByKey(props, "spacedOutP1")};
  }

  img {
    max-width: 100%;
  }

  h1 {
    ${(props) => getTypographyByKey(props, "docHeader")}
    word-break: break-word;
  }

  h2,
  h3 {
    ${(props) => getTypographyByKey(props, "h5")}
    font-weight: 600;
  }

  h1,
  h2,
  h3,
  strong {
    color: #484848;
  }

  .documentation-cta {
    ${(props) => getTypographyByKey(props, "p3")}
    white-space: nowrap;
    background: ${(props) =>
      props.theme.colors.globalSearch.documentationCtaBackground};
    color: ${(props) => props.theme.colors.globalSearch.documentationCtaText};
    padding: ${(props) => props.theme.spaces[2]}px;
    margin: 0 ${(props) => props.theme.spaces[2]}px;
    position: relative;
    bottom: 3px;
  }

  & a {
    color: ${(props) => props.theme.colors.globalSearch.documentLink};
  }

  code {
    word-break: break-word;
    font-size: 12px;
    background: ${(props) => props.theme.colors.globalSearch.codeBackground};
  }

  pre {
    background: ${(props) =>
      props.theme.colors.globalSearch.codeBackground} !important;
    white-space: pre-wrap;
    overflow: hidden;
  }
  .CodeMirror {
    pre {
      background: transparent !important;
    }
  }
`;

function getSnippet(snippet: string, args: any) {
  const regex = /\${(.*?)}/g;
  return snippet.replace(regex, function(match, capture) {
    const substitution = args[capture] || "";
    if (substitution.startsWith("{{") && substitution.endsWith("}}")) {
      return substitution.substring(2, substitution.length - 2);
    }
    return substitution || "${" + capture + "}";
  });
}

function DocumentationDescription({
  item,
  query,
}: {
  item: SearchItem;
  query: string;
}) {
  const {
    _highlightResult: {
      document: { value: rawDocument },
      title: { value: rawTitle },
    },
  } = item;
  const content = parseDocumentationContent({
    rawDocument: rawDocument,
    rawTitle: rawTitle,
    path: item.path,
    query,
  });
  const containerRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollToMatchedValue();
  }, [content]);

  const scrollToMatchedValue = () => {
    const root = containerRef.current;
    if (!root) return;
    const list = root.getElementsByTagName(algoliaHighlightTag);
    if (list.length) {
      const bestMatch = Array.from(list).reduce((accumulator, currentValue) => {
        if (
          currentValue.textContent &&
          accumulator.textContent &&
          currentValue.textContent.length > accumulator.textContent.length
        )
          return currentValue;
        return accumulator;
      }, list[0]);

      bestMatch.scrollIntoView();
    } else {
      setTimeout(() => {
        root.firstElementChild?.scrollIntoView();
      }, 0);
    }
  };

  return content ? (
    <div dangerouslySetInnerHTML={{ __html: content }} ref={containerRef} />
  ) : null;
}

const StyledHitEnterMessageContainer = styled.div`
  background: ${(props) =>
    props.theme.colors.globalSearch.navigateUsingEnterSection};
  padding: ${(props) =>
    `${props.theme.spaces[6]}px ${props.theme.spaces[3]}px`};
  ${(props) => getTypographyByKey(props, "p3")}
`;

const StyledKey = styled.span`
  margin: 0 ${(props) => props.theme.spaces[1]}px;
  color: ${(props) => props.theme.colors.globalSearch.navigateToEntityEnterkey};
  font-weight: bold;
`;

const StyledHighlightWrapper = styled.span`
  margin: 0 ${(props) => props.theme.spaces[1]}px;
`;

function HitEnterMessage({ item, query }: { item: SearchItem; query: string }) {
  const title = getItemTitle(item);

  return (
    <StyledHitEnterMessageContainer
      style={{ display: "flex", alignItems: "center" }}
    >
      &#10024; Press <StyledKey>&#8629;</StyledKey> to navigate to
      <StyledHighlightWrapper>
        <Highlight match={query} text={title} />
      </StyledHighlightWrapper>
      <ActionLink isActiveItem item={item} />
    </StyledHitEnterMessageContainer>
  );
}

const SnippetContainer = styled.div`
  display: flex;
  flex-direction: column;
  .snippet-title {
    color: #090707;
    font-size: 17px;
    font-weight: 500;
    display: flex;
    justify-content: space-between;
    .action-msg {
      color: #a9a7a7;
      font-size: 11px;
      font-weight: 400;
      flex-shrink: 0;
    }
  }
  .snippet-desc {
    color: #4b4848;
    font-size: 14px;
    font-weight: 400;
    margin-top: 10px;
  }
  .snippet-group {
    margin: 5px 0;
    .header {
      font-weight: 500;
      font-size: 14px;
    }
    .content {
      font-weight: 400;
      font-size: 14px;
    }
    .argument {
      display: flex;
      justify-content: space-between;
      flex-direction: column;
      margin: 5px 0;
      .args-dropdown {
        box-shadow: none;
        background-color: ${(props) => props.theme.colors.propertyPane.bg};
        border: none;
      }
    }
  }
  .tab-container {
    border-top: none;
    .react-tabs__tab-panel {
      background: white !important;
      height: auto !important;
      overflow: hidden;
      margin-top: 2px;
      border-top: 1px solid #f0f0f0;
      .actions-container {
        display: flex;
        margin-top: 15px;
        button {
          margin-right: 5px;
        }
      }
    }
    .react-tabs__tab-list {
      background: white !important;
      padding: 0 10px !important;
      color: #a9a7a7 !important;
      .react-tabs__tab--selected {
        color: #f86a2b;
      }
    }
  }
`;

function SnippetDescription(props: any) {
  const {
    item: {
      body: { additionalInfo, args, examples, snippet, summary, title },
      language,
      returnType,
    },
  } = props;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedArgs, setSelectedArgs] = useState<any>({});
  const dispatch = useDispatch();
  return (
    <SnippetContainer>
      <div className="snippet-title">
        <span>{title}</span>
        <span className="action-msg">Hit ⏎ to insert</span>
      </div>
      <div className="snippet-desc">{summary}</div>
      <SyntaxHighlighter language={language} style={xcode}>
        {getSnippet(snippet, selectedArgs)}
      </SyntaxHighlighter>
      <TabbedViewContainer className="tab-container">
        <TabComponent
          onSelect={setSelectedIndex}
          selectedIndex={selectedIndex}
          tabs={[
            {
              key: "Example",
              title: "Example",
              panelComponent:
                examples && examples.length ? (
                  <div className="snippet-group">
                    <div className="content">
                      {examples.map((ex: any) => (
                        <>
                          <p>{ex.title}</p>
                          <SyntaxHighlighter language={language} style={xcode}>
                            {ex.code}
                          </SyntaxHighlighter>
                          <p>{ex.summary}</p>
                        </>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div />
                ),
            },
            // setSelectedArgs({
            //   ...selectedArgs,
            //   [arg.name]: value,
            // })
            {
              key: "Customize",
              title: "Customize",
              panelComponent:
                args && args.length > 0 ? (
                  <div className="snippet-group">
                    {args.map((arg: any) => (
                      <div className="argument" key={arg.name}>
                        <span>{arg.name}</span>
                        <CodeEditor
                          expected={arg.type}
                          hideEvaluatedValue
                          input={{
                            value: selectedArgs[arg.name],
                            onChange: (value: any) => {
                              setSelectedArgs({
                                ...selectedArgs,
                                [arg.name]: value,
                              });
                            },
                          }}
                          mode={EditorModes.TEXT_WITH_BINDING}
                          showLightningMenu={false}
                          size={EditorSize.EXTENDED}
                          tabBehaviour={TabBehaviour.INDENT}
                          theme={EditorTheme.LIGHT}
                        />
                      </div>
                    ))}
                    <div className="actions-container">
                      <Button
                        className="t--apiFormRunBtn"
                        onClick={() => {
                          dispatch(
                            evaluateSnippet({
                              expression: getSnippet(snippet, selectedArgs),
                              dataType: returnType,
                            }),
                          );
                        }}
                        size={Size.medium}
                        tag="button"
                        text="Run"
                        type="button"
                      />
                      <Button
                        className="t--apiFormRunBtn"
                        onClick={() => {
                          console.log();
                        }}
                        size={Size.medium}
                        tag="button"
                        text="Copy Snippet"
                        type="button"
                      />
                    </div>
                  </div>
                ) : (
                  <div />
                ),
            },
          ]}
        />
      </TabbedViewContainer>
      {additionalInfo &&
        additionalInfo.map(
          ({ content, header }: { header: string; content: string }) => (
            <div className="snippet-group" key={header}>
              <div className="header">{header}</div>
              <div className="content">{content}</div>
            </div>
          ),
        )}
    </SnippetContainer>
  );
}

const descriptionByType = {
  [SEARCH_ITEM_TYPES.document]: DocumentationDescription,
  [SEARCH_ITEM_TYPES.action]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.widget]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.datasource]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.page]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.sectionTitle]: () => null,
  [SEARCH_ITEM_TYPES.placeholder]: () => null,
  [SEARCH_ITEM_TYPES.category]: () => null,
  [SEARCH_ITEM_TYPES.snippet]: SnippetDescription,
};

function Description(props: Props) {
  const { activeItem, activeItemType } = props;

  if (!activeItemType || !activeItem) return null;
  const Component = descriptionByType[activeItemType];

  return (
    <Container>
      <Component item={activeItem} query={props.query} />
    </Container>
  );
}

export default Description;
