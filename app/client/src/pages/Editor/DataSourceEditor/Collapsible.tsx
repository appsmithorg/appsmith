import React, { useCallback, useEffect } from "react";
import { Collapse } from "@blueprintjs/core";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { getDatasourceCollapsibleState } from "selectors/ui";
import { setDatasourceCollapsible } from "actions/datasourceActions";
import isUndefined from "lodash/isUndefined";
import { Divider } from "design-system";
import { Icon } from "design-system";

const SectionLabel = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.17px;
  color: var(--ads-v2-color-fg);
  display: flex;
  .cs-icon {
    margin-left: ${(props) => props.theme.spaces[2]}px;
  }
`;

const SectionContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 270px;
  cursor: pointer;
  margin-bottom: 5px;
`;

const TopBorder = styled(Divider)`
  margin-top: 24px;
  margin-bottom: 16px;
`;

interface ComponentProps {
  children: any;
  title: string;
  defaultIsOpen?: boolean;
  // header icon props of collapse header
  headerIcon?: {
    name: string;
    color?: string;
  };
  showTopBorder?: boolean;
  showSection?: boolean;
}

type Props = ComponentProps;

function Collapsible(props: Props) {
  const {
    children,
    defaultIsOpen,
    headerIcon,
    showSection = true,
    showTopBorder = true,
    title,
  } = props;
  const dispatch = useDispatch();
  const isOpen = useSelector((state: AppState) =>
    getDatasourceCollapsibleState(state, title),
  );

  const setIsOpen = useCallback((open) => {
    dispatch(setDatasourceCollapsible(title, open));
  }, []);

  useEffect(() => {
    // We set the default value only when there is no state stored yet for the same
    if (defaultIsOpen && isUndefined(isOpen)) {
      setIsOpen(defaultIsOpen);
    }
  }, [defaultIsOpen, isOpen]);

  return (
    <section
      data-replay-id={`section-${title}`}
      data-testid={`section-${title}`}
    >
      {showTopBorder && <TopBorder className="t--collapse-top-border" />}
      {showSection && (
        <SectionContainer
          className="t--collapse-section-container"
          onClick={() => setIsOpen(!isOpen)}
        >
          <SectionLabel>
            {title}
            {headerIcon && <Icon name={headerIcon.name} size="md" />}
          </SectionLabel>
          <Icon
            name={isOpen ? "arrow-up-s-line" : "arrow-down-s-line"}
            size="md"
          />
        </SectionContainer>
      )}

      <Collapse isOpen={isOpen} keepChildrenMounted>
        {children}
      </Collapse>
    </section>
  );
}

export default Collapsible;
