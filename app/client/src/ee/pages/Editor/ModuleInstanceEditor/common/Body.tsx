import styled from "styled-components";

const Body = styled.div<{ width?: "full" }>`
  padding: var(--ads-v2-spaces-7);
  width: ${({ width }) => (width === "full" ? "100%" : "600px")};
  display: flex;
  flex-direction: column;
  flex: 1;
`;

export default Body;
