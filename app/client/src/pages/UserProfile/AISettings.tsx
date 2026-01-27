import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Button, Input, Select, Text } from "@appsmith/ads";
import styled from "styled-components";
import UserApi from "ee/api/UserApi";
import { toast } from "@appsmith/ads";
import { updateAISettings } from "ee/actions/aiAssistantActions";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-5);
  padding: var(--ads-v2-spaces-7) 0;
`;

const FieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-2);
  max-width: 500px;
`;

const LabelWrapper = styled.div`
  margin-bottom: var(--ads-v2-spaces-1);
`;

function AISettings() {
  const dispatch = useDispatch();
  const [provider, setProvider] = useState<string>("CLAUDE");
  const [claudeApiKey, setClaudeApiKey] = useState<string>("");
  const [openaiApiKey, setOpenaiApiKey] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(function loadAISettingsOnMount() {
    const fetchApiKeys = async () => {
      try {
        const [claudeResponse, openaiResponse] = await Promise.all([
          UserApi.getAIApiKey("CLAUDE"),
          UserApi.getAIApiKey("OPENAI"),
        ]);

        if (claudeResponse.data.responseMeta.success) {
          setClaudeApiKey(claudeResponse.data.data.hasApiKey ? "••••••••" : "");
        }
        if (openaiResponse.data.responseMeta.success) {
          setOpenaiApiKey(openaiResponse.data.data.hasApiKey ? "••••••••" : "");
        }
      } catch (error) {
        toast.show("Failed to load AI settings", { kind: "error" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKeys();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const apiKey = provider === "CLAUDE" ? claudeApiKey : openaiApiKey;
      const response = await UserApi.updateAIApiKey(provider, apiKey);

      if (response.data.responseMeta.success) {
        dispatch(updateAISettings({ provider, hasApiKey: true }));
        toast.show("AI API key saved successfully", { kind: "success" });
        if (provider === "CLAUDE") {
          setClaudeApiKey("••••••••");
        } else {
          setOpenaiApiKey("••••••••");
        }
      } else {
        toast.show("Failed to save AI API key", { kind: "error" });
      }
    } catch (error) {
      toast.show("Failed to save AI API key", { kind: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Wrapper>Loading...</Wrapper>;
  }

  return (
    <Wrapper>
      <Text kind="heading-s" renderAs="h2">
        AI Assistant Settings
      </Text>
      <Text kind="body-m" color="var(--ads-v2-color-fg-muted)">
        Configure your API keys to enable AI assistance in JavaScript modules and queries.
        Your API keys are encrypted and stored securely.
      </Text>

      <FieldWrapper>
        <LabelWrapper>
          <Text kind="body-m">AI Provider</Text>
        </LabelWrapper>
        <Select
          options={[
            { label: "Claude (Anthropic)", value: "CLAUDE" },
            { label: "OpenAI (ChatGPT)", value: "OPENAI" },
          ]}
          value={provider}
          onChange={(value) => setProvider(value as string)}
        />
      </FieldWrapper>

      <FieldWrapper>
        <LabelWrapper>
          <Text kind="body-m">
            {provider === "CLAUDE" ? "Claude API Key" : "OpenAI API Key"}
          </Text>
        </LabelWrapper>
        <Input
          type="password"
          value={provider === "CLAUDE" ? claudeApiKey : openaiApiKey}
          onChange={(value) => {
            if (provider === "CLAUDE") {
              setClaudeApiKey(value);
            } else {
              setOpenaiApiKey(value);
            }
          }}
          placeholder={
            provider === "CLAUDE"
              ? "Enter your Claude API key"
              : "Enter your OpenAI API key"
          }
        />
        <Text kind="body-s" color="var(--ads-v2-color-fg-muted)">
          {provider === "CLAUDE"
            ? "Get your API key from https://console.anthropic.com/"
            : "Get your API key from https://platform.openai.com/api-keys"}
        </Text>
      </FieldWrapper>

      <FieldWrapper>
        <Button
          kind="primary"
          onClick={handleSave}
          isLoading={isSaving}
          size="md"
        >
          Save API Key
        </Button>
      </FieldWrapper>
    </Wrapper>
  );
}

export default AISettings;
