import React from "react";
import { Link } from "@appsmith/ads";
import styled from "styled-components";

const FooterWrapper = styled.div`
  width: 85%;
  margin: 0 auto;
  text-align: center;
  a {
    display: inline;
    span {
      display: inline;
      svg {
        display: inline;
      }
    }
  }
`;

function FooterLinks() {
  return (
    <FooterWrapper>
      By using Appsmith, you are agreeing to our &nbsp;
      <Link target="_blank" to="/privacy-policy.html">
        privacy policy
      </Link>
      &nbsp; and &nbsp;
      <Link target="_blank" to="/terms-and-conditions.html">
        terms of service
      </Link>
      .
    </FooterWrapper>
  );
}

export default FooterLinks;
