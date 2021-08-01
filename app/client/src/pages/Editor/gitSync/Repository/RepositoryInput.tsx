import React from "react";
import TextInput from "components/ads/TextInput";

const placeholder = "Repository URL";

type Props = {
  onChange: (value: string) => void;
};

function RepositoryInput({ onChange }: Props) {
  return <TextInput onChange={onChange} placeholder={placeholder} />;
}

export default RepositoryInput;
