import styled from "styled-components";
import { ModalContent } from "../Modal";

export const StyledModalContent = styled(ModalContent)`
  padding: 0;
  width: 400px;
  overflow: hidden;
`;

export const BannerImage = styled.div<{ url: string }>`
  height: 350px;
  width: 100%;
  background-image: url("${({ url }) => url}");
  background-position: center;
  background-size: cover;
`;

export const BannerContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--ads-v2-spaces-9);
  gap: var(--ads-v2-spaces-7);
`;

export const BannerData = styled.div`
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: var(--ads-v2-spaces-3);
`;

export const BannerTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ads-v2-spaces-3);
`;

export const BannerFooter = styled.div`
  display: flex;
  flex-direction: row;
  gap: var(--ads-v2-spaces-3);
`;
