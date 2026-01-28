import React, { useCallback, useEffect, useState } from "react";
import { Button, Input, Select, Switch, Text } from "@appsmith/ads";
import styled from "styled-components";
import OrganizationApi from "ee/api/OrganizationApi";
import { toast } from "@appsmith/ads";

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

const AI_PROVIDER_OPTIONS = [
  { label: "Claude (Anthropic)", value: "CLAUDE" },
  { label: "OpenAI (ChatGPT)", value: "OPENAI" },
];

function AISettings() {
  const [provider, setProvider] = useState<string>("CLAUDE");
  const [claudeApiKey, setClaudeApiKey] = useState<string>("");
  const [openaiApiKey, setOpenaiApiKey] = useState<string>("");
  const [isAIAssistantEnabled, setIsAIAssistantEnabled] =
    useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(function fetchAIConfigOnMount() {
    const fetchAIConfig = async () => {
      try {
        const response = await OrganizationApi.getAIConfig();

        if (response.data.responseMeta.success) {
          const config = response.data.data;

          setIsAIAssistantEnabled(config.isAIAssistantEnabled || false);
          setProvider(config.provider || "CLAUDE");
          setClaudeApiKey(config.hasClaudeApiKey ? "••••••••" : "");
          setOpenaiApiKey(config.hasOpenaiApiKey ? "••••••••" : "");
        }
      } catch (error) {
        toast.show("Failed to load AI settings", { kind: "error" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAIConfig();
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const request: {
        provider: string;
        isAIAssistantEnabled: boolean;
        claudeApiKey?: string;
        openaiApiKey?: string;
      } = {
        provider,
        isAIAssistantEnabled,
      };

      if (claudeApiKey && claudeApiKey !== "••••••••") {
        request.claudeApiKey = claudeApiKey;
      }

      if (openaiApiKey && openaiApiKey !== "••••••••") {
        request.openaiApiKey = openaiApiKey;
      }

      const response = await OrganizationApi.updateAIConfig(request);

      if (response.data.responseMeta.success) {
        toast.show("AI configuration saved successfully", { kind: "success" });

        if (claudeApiKey && claudeApiKey !== "••••••••") {
          setClaudeApiKey("••••••••");
        }

        if (openaiApiKey && openaiApiKey !== "••••••••") {
          setOpenaiApiKey("••••••••");
        }
      } else {
        toast.show("Failed to save AI configuration", { kind: "error" });
      }
    } catch (error) {
      toast.show("Failed to save AI configuration", { kind: "error" });
    } finally {
      setIsSaving(false);
    }
  }, [
    claudeApiKey,
    isAIAssistantEnabled,
    openaiApiKey,
    provider,
    setClaudeApiKey,
    setOpenaiApiKey,
  ]);

  const handleProviderChange = useCallback((value: string | number) => {
    setProvider(String(value));
  }, []);

  const handleClaudeKeyChange = useCallback((value: string) => {
    setClaudeApiKey(value);
  }, []);

  const handleOpenAIKeyChange = useCallback((value: string) => {
    setOpenaiApiKey(value);
  }, []);

  if (isLoading) {
    return <Wrapper>Loading...</Wrapper>;
  }

  return (
    <Wrapper>
      <Text kind="heading-s" renderAs="h2">
        AI Assistant Configuration
      </Text>
      <Text color="var(--ads-v2-color-fg-muted)" kind="body-m">
        Configure AI assistant for your organization. API keys are encrypted and
        stored securely. Only organization administrators can configure these
        settings.
      </Text>

      <FieldWrapper>
        <LabelWrapper>
          <Switch
            isSelected={isAIAssistantEnabled}
            onChange={setIsAIAssistantEnabled}
          >
            <Text kind="body-m">Enable AI Assistant</Text>
          </Switch>
        </LabelWrapper>
        <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
          When enabled, all users in your organization can use AI assistance in
          JavaScript modules and queries.
        </Text>
      </FieldWrapper>

      <FieldWrapper>
        <LabelWrapper>
          <Text kind="body-m">AI Provider</Text>
        </LabelWrapper>
        <Select
          onChange={handleProviderChange}
          options={AI_PROVIDER_OPTIONS}
          value={provider}
        />
      </FieldWrapper>

      <FieldWrapper>
        <LabelWrapper>
          <Text kind="body-m">Claude API Key</Text>
        </LabelWrapper>
        <Input
          onChange={handleClaudeKeyChange}
          placeholder="Enter Claude API key (leave blank to keep existing)"
          type="password"
          value={claudeApiKey}
        />
        <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
          Get your API key from https://console.anthropic.com/
        </Text>
      </FieldWrapper>

      <FieldWrapper>
        <LabelWrapper>
          <Text kind="body-m">OpenAI API Key</Text>
        </LabelWrapper>
        <Input
          onChange={handleOpenAIKeyChange}
          placeholder="Enter OpenAI API key (leave blank to keep existing)"
          type="password"
          value={openaiApiKey}
        />
        <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
          Get your API key from https://platform.openai.com/api-keys
        </Text>
      </FieldWrapper>

      <FieldWrapper>
        <Button
          isLoading={isSaving}
          kind="primary"
          onClick={handleSave}
          size="md"
        >
          Save Configuration
        </Button>
      </FieldWrapper>
    </Wrapper>
  );
}

export default AISettings;
