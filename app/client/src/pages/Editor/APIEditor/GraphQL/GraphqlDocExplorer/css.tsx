import { Colors } from "constants/Colors";
import styled from "styled-components";

export const DefaultValueWrapper = styled.span`
  color: ${Colors.CURIOUS_BLUE};
`;

export const DirectiveWrapper = styled.span`
  color: ${Colors.LIGHT_GREEN_CYAN};
`;

export const IconContainer = styled.div<{ showPointer: boolean }>`
  height: 30px;
  display: flex;
  align-items: center;
  cursor: ${(props) => (props.showPointer ? "pointer" : "default")};
  padding-left: 16px;
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
  border-bottom: 1px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  background: white;
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

export const FieldLinkWrapper = styled.a`
  color: ${Colors.PURPLE};
`;

export const ExplorerWrapper = styled.div`
  display: flex;
  flex-grow: 1;
  height: 100%;
  border-left: 1px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  section {
    width: 100%;
  }
`;

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

export const SchemaElementWrapper = styled.div`
  &:not(:first-of-type) {
    margin-top: 12px;
  }
  .t--gql-root-type {
    color: ${Colors.GRAY_800};
  }
`;

export const MultipleArgumentsWrapper = styled.div`
  margin-left: 10px;
`;

export const FieldItemWrapper = styled.div`
  margin-bottom: 10px;
`;

export const TypeLinkWrapper = styled.a`
  color: ${Colors.PRIMARY_ORANGE};
`;

export const ArgumentDefNameWrapper = styled.span`
  color: ${Colors.GREY_8};
`;

export const DefinitionWrapper = styled.div`
  margin-left: 10px;
`;
