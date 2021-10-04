import React from "react";
import styled from "styled-components";

const FooterLink = styled.a`
  cursor: pointer;
  text-decoration: none;
  :hover {
    text-decoration: underline;
    color: ${(props) => props.theme.colors.text.normal};
  }
  font-weight: ${(props) => props.theme.typography.releaseList.fontWeight};
  font-size: ${(props) => props.theme.typography.releaseList.fontSize}px;
  line-height: ${(props) => props.theme.typography.releaseList.lineHeight}px;
  letter-spacing: ${(props) =>
    props.theme.typography.releaseList.letterSpacing}px;
  color: #000 !important;
`;

const FooterLinksContainer = styled.div`
  padding: ${(props) => props.theme.spaces[9]}px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  max-width: ${(props) => props.theme.authCard.width}px;
`;

function FooterLinks() {
  return (
    <FooterLinksContainer>
      <FooterLink href="/privacy-policy.html" target="_blank">
        Privacy Policy
      </FooterLink>
      <FooterLink href="/terms-and-conditions.html" target="_blank">
        Terms and conditions
      </FooterLink>
    </FooterLinksContainer>
  );
}

export default FooterLinks;
