import React from "react";
import styled from "styled-components";
import "@github/g-emoji-element";
import moment from "moment";
import Dialog from "components/ads/DialogComponent";
import UpdatesButton from "./UpdatesButton";
import releases from "./mockReleases";

const StyledContainer = styled.div`
  padding-top: ${(props) => props.theme.spaces[11]}px;
`;

const StyledTitle = styled.div`
  font-weight: ${(props) => props.theme.typography.h2.fontWeight};
  font-size: ${(props) => props.theme.typography.h2.fontSize}px;
  line-height: ${(props) => props.theme.typography.h2.lineHeight}px;
  letter-spacing: ${(props) => props.theme.typography.h2.letterSpacing}px;
  color: ${(props) => props.theme.colors.modal.title};
`;

const StyledSeparator = styled.div`
  width: 100%;
  background-color: ${(props) => props.theme.colors.modal.separator};
  mix-blend-mode: normal;
  opacity: 0.6;
  height: 1px;
`;

const StyledDate = styled.div`
  font-weight: ${(props) => props.theme.typography.releaseList.fontWeight};
  font-size: ${(props) => props.theme.typography.releaseList.fontSize}px;
  line-height: ${(props) => props.theme.typography.releaseList.lineHeight}px;
  letter-spacing: ${(props) =>
    props.theme.typography.releaseList.letterSpacing}px;
  color: ${(props) => props.theme.colors.text.normal};
  margin-top: ${(props) => props.theme.spaces[3]}px;
`;

const StyledContent = styled.div`
  li,
  p {
    font-weight: ${(props) => props.theme.typography.releaseList.fontWeight};
    font-size: ${(props) => props.theme.typography.releaseList.fontSize}px;
    line-height: ${(props) => props.theme.typography.releaseList.lineHeight}px;
    letter-spacing: ${(props) =>
      props.theme.typography.releaseList.letterSpacing}px;
    color: ${(props) => props.theme.colors.text.normal};
  }
  a {
    color: ${(props) => props.theme.colors.modal.link};
  }
  h1,
  h2,
  h3,
  h4 {
    color: ${(props) => props.theme.colors.modal.title};
  }
`;

type Release = {
  descriptionHtml: string;
  name: string;
  publishedAt?: string;
};

const ProductUpdatesModal = () => {
  return (
    <Dialog
      trigger={<UpdatesButton />}
      title={"Product Updates"}
      width={580}
      maxHeight={"80vh"}
    >
      {releases.map(
        ({ descriptionHtml, name, publishedAt }: Release, index: number) => (
          <StyledContainer key={index}>
            <StyledTitle>{name}</StyledTitle>
            <StyledDate>
              {moment(publishedAt).format("Do MMMM, YYYY")}
            </StyledDate>
            <StyledContent
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
            <StyledSeparator />
          </StyledContainer>
        ),
      )}
    </Dialog>
  );
};

export default ProductUpdatesModal;
