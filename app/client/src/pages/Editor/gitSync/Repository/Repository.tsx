import React, { useState } from "react";
import { useEffect } from "react";
import { Title, Subtitle } from "../StyledComponents";
import Button, { Size, Category } from "components/ads/Button";
import { Variant } from "components/ads/common";

import RepositoryInput from "./RepositoryInput";
import RepositoryAuthForm from "./RepositoryAuthForm";

// TODO move these to messages
const destination = () => "Destination";
const chooseExistingRepo = () =>
  "Choose an existing repository to host your project and keep it in sync with Appsmith";
const connectMsg = () => "connect";
const downloadPublicKeyMsg = () => "Download public key";

/**
 * Connect to a git repo (init flow)
 * - Get the repo url from the user
 * - if repo url has https protocol: get credentials
 * - Else give an option to download public key
 * - Test button to check if we're able to connect to a repo and the repo is valid
 * - Once the setup is complete collapse the view to show only the repo details with an edit button
 * Fetch repo details
 * - If not found show init flow
 * - Else show repo details
 */

function Repository() {
  const [repoURL, setRepoURL] = useState("");
  const [isHttps, setIsHttps] = useState(false);

  useEffect(() => {
    setIsHttps(repoURL.startsWith("https"));
  }, [repoURL]);

  return (
    <>
      <Title>{destination()}</Title>
      <Subtitle>{chooseExistingRepo()}</Subtitle>
      <RepositoryInput onChange={setRepoURL} />
      {isHttps ? (
        <RepositoryAuthForm />
      ) : (
        <Button
          category={Category.tertiary}
          onClick={() => {
            console.log("download public key");
          }}
          size={Size.large}
          text={downloadPublicKeyMsg()}
          variant={Variant.info}
        />
      )}
      <Button
        onClick={() => {
          console.log("connect");
        }}
        size={Size.large}
        text={connectMsg()}
      />
    </>
  );
}

export default Repository;
