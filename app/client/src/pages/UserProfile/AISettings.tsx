import React, { useCallback, useMemo, useState, useEffect } from "react";
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
  const [hasClaudeApiKey, setHasClaudeApiKey] = useState(false);
  const [hasOpenaiApiKey, setHasOpenaiApiKey] = useState(false);
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
          setHasClaudeApiKey(claudeResponse.data.data.hasApiKey);
        }

        if (openaiResponse.data.responseMeta.success) {
          setHasOpenaiApiKey(openaiResponse.data.data.hasApiKey);
        }
      } catch (error) {
        toast.show("Failed to load AI settings", { kind: "error" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKeys();
  }, []);

  const currentHasKey =
    provider === "CLAUDE" ? hasClaudeApiKey : hasOpenaiApiKey;
  const currentKeyInput = provider === "CLAUDE" ? claudeApiKey : openaiApiKey;

  const handleSave = useCallback(async () => {
    if (!currentKeyInput.trim()) {
      toast.show("Please enter an API key", { kind: "warning" });

      return;
    }

    setIsSaving(true);
    try {
      const response = await UserApi.updateAIApiKey(provider, currentKeyInput);

      if (response.data.responseMeta.success) {
        dispatch(updateAISettings({ provider, hasApiKey: true }));
        toast.show("AI API key saved successfully", {
          kind: "success",
        });

        if (provider === "CLAUDE") {
          setClaudeApiKey("");
          setHasClaudeApiKey(true);
        } else {
          setOpenaiApiKey("");
          setHasOpenaiApiKey(true);
        }
      } else {
        toast.show("Failed to save AI API key", { kind: "error" });
      }
    } catch (error) {
      toast.show("Failed to save AI API key", { kind: "error" });
    } finally {
      setIsSaving(false);
    }
  }, [provider, currentKeyInput, dispatch]);

  const handleProviderChange = useCallback(
    (value: string) => setProvider(value as string),
    [],
  );

  const providerOptions = useMemo(
    () => [
      { label: "Claude (Anthropic)", value: "CLAUDE" },
      { label: "OpenAI (ChatGPT)", value: "OPENAI" },
    ],
    [],
  );

  const handleKeyChange = useCallback(
    (value: string) => {
      if (provider === "CLAUDE") {
        setClaudeApiKey(value);
      } else {
        setOpenaiApiKey(value);
      }
    },
    [provider],
  );

  if (isLoading) {
    return <Wrapper>Loading...</Wrapper>;
  }

  return (
    <Wrapper>
      <Text kind="heading-s" renderAs="h2">
        AI Assistant Settings
      </Text>
      <Text color="var(--ads-v2-color-fg-muted)" kind="body-m">
        Configure your API keys to enable AI assistance in JavaScript modules
        and queries. Your API keys are encrypted and stored securely.
      </Text>

      <FieldWrapper>
        <LabelWrapper>
          <Text kind="body-m">AI Provider</Text>
        </LabelWrapper>
        <Select
          onChange={handleProviderChange}
          options={providerOptions}
          value={provider}
        />
      </FieldWrapper>

      <FieldWrapper>
        <LabelWrapper>
          <Text kind="body-m">
            {provider === "CLAUDE" ? "Claude API Key" : "OpenAI API Key"}
          </Text>
        </LabelWrapper>
        <Input
          onChange={handleKeyChange}
          placeholder={
            currentHasKey
              ? "Key saved - enter a new key to replace it"
              : provider === "CLAUDE"
                ? "Enter your Claude API key"
                : "Enter your OpenAI API key"
          }
          type="password"
          value={currentKeyInput}
        />
        {currentHasKey && !currentKeyInput && (
          <Text color="var(--ads-v2-color-fg-success)" kind="body-s">
            API key is configured. Enter a new key to replace it.
          </Text>
        )}
        <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
          {provider === "CLAUDE"
            ? "Get your API key from https://console.anthropic.com/"
            : "Get your API key from https://platform.openai.com/api-keys"}
        </Text>
      </FieldWrapper>

      <FieldWrapper>
        <Button
          isDisabled={!currentKeyInput.trim()}
          isLoading={isSaving}
          kind="primary"
          onClick={handleSave}
          size="md"
        >
          Save API Key
        </Button>
      </FieldWrapper>
    </Wrapper>
  );
}

export default AISettings;
