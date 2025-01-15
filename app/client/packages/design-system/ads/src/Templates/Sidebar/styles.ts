import styled from "styled-components";
import { Flex } from "../../Flex";

export const Container = styled(Flex)`
  width: 50px;
  border-right: 1px solid var(--ads-v2-color-border);
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  background-color: var(--ads-v2-color-bg);
  position: relative;
`;
