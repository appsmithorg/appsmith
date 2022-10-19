import { Colors } from "constants/Colors";
import styled from "styled-components";

const ITEM_COLORS = {
  argument: Colors.GREY_8,
  field: Colors.PURPLE,
  type: Colors.PRIMARY_ORANGE,
};

/* Start: DefaultValue.tsx */
export const DefaultValueWrapper = styled.span`
  color: ${Colors.CURIOUS_BLUE};
`;
/* End: DefaultValue.tsx */

/* Start: Directive.tsx */
export const DirectiveWrapper = styled.span`
  color: ${Colors.LIGHT_GREEN_CYAN};
`;
/* End: Directive.tsx */

/* Start: Explorer.tsx */
export const IconContainer = styled.div<{ showPointer: boolean }>`
  height: 30px;
  display: flex;
  align-items: center;
  cursor: ${(props) => (props.showPointer ? "pointer" : "default")};
  width: fit-content;
`;

export const DocExplorerSection = styled.section`
  width: 100%;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

export const DocExplorerHeader = styled.div`
  display: flex;
  height: 30px;
  width: 100%;
  align-items: center;
  background: ${Colors.SEA_SHELL};
  span {
    flex-grow: 1;
    text-align: center;
  }
`;

export const DocExplorerContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  margin-bottom: 20px;
  overflow-y: auto;
`;

export const DocExplorerErrorWrapper = styled.div`
  color: ${Colors.ERROR_RED};
  width: 100%;
  text-align: center;
`;

export const DocExplorerLoading = styled.div`
  color: ${Colors.GREY_5};
`;

/* End: Explorer.tsx */

/* Start: ExplorerSection.tsx */

export const ExplorerSectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 10px;
`;

export const ExplorerSectionTitleWrapper = styled.div`
  display: flex;
  width: 100%;
  color: ${Colors.GRAY_700};
  font-weight: bold;
  margin-bottom: 5px;
`;

/* End: ExplorerSection.tsx */

/* Start: FieldLink.tsx */
export const FieldLinkWrapper = styled.a`
  color: ${ITEM_COLORS.field};
`;
/* End: FieldLink.tsx */

/* Start: Index.tsx */
export const ExplorerWrapper = styled.div`
  display: flex;
  flex-grow: 1;
  height: 100%;
  border-left: 1px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  section {
    width: 100%;
  }
`;
/* End: Index.tsx */

/* Start: MarkdownContent.tsx */
export const MarkdownContentWrapper = styled.div`
  color: ${Colors.GRAY_500};
  margin-bottom: 10px;
  pre {
    overflow: auto;
    padding: 6px;
    background-color: ${Colors.GREY_2};
    color: ${Colors.GREY_6};
  }
`;
/* End: MarkdownContent.tsx */

/* Start: SchemaDocumentation.tsx */
export const SchemaElementWrapper = styled.div`
  &:not(:first-of-type) {
    margin-top: 12px;
  }
  .t--gql-root-type {
    color: ${Colors.GRAY_800};
  }
`;

/* End: SchemaDocumentation.tsx */

/* Start: TypeDocumentation.tsx */
export const MultipleArgumentsWrapper = styled.div`
  margin-left: 10px;
`;

export const FieldItemWrapper = styled.div`
  margin-bottom: 10px;
  .t--gql-arguments {
    margin-left: 10px;
  }
`;

/* End: TypeDocumentation.tsx */

/* Start: TypeLink.tsx */
export const TypeLinkWrapper = styled.a`
  color: ${ITEM_COLORS.type};
`;

/* Start: TypeLink.tsx */

/* Start: Argument.tsx */
export const ArgumentDefNameWrapper = styled.span`
  color: ${ITEM_COLORS.argument};
`;

export const DefinitionWrapper = styled.div`
  margin-left: 0px;
`;

/* End: Argument.tsx */

/* Start: Search.tsx */
export const SearchWrapper = styled.div`
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
`;
export const SearchResultWrapper = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 180px;
  overflow: auto;
  background: ${Colors.WHITE};
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-left: 0;
  border-right: 0;
`;
export const SearchResultDivider = styled.div`
  padding: 5px 0;
  position: relative;
  text-align: center;
  z-index: 1;
  :before {
    content: "";
    position: absolute;
    width: 100%;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    height: 2px;
    z-index: -1;
    background: ${Colors.GREY_5};
  }
  span {
    background: ${Colors.WHITE};
    z-index: 1;
    color: ${Colors.GREY_5};
    padding: 0 10px;
  }
`;

export const SearchItem = styled.div`
  padding: 5px;
  display: flex;
  flex-wrap: wrap;
  cursor: pointer;
`;

export const ArgumentSearchWrapper = styled.span`
  color: ${ITEM_COLORS.argument};
`;
export const TypeLinkSearchWrapper = styled.span`
  color: ${ITEM_COLORS.type};
`;
export const FieldLinkSearchWrapper = styled.span`
  color: ${ITEM_COLORS.field};
`;
export const SearchNoResult = styled.span`
  color: ${Colors.GREY_5};
`;
/* End: Search.tsx */
