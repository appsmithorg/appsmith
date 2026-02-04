import React, { useState, useEffect } from "react";
import { Button, Input, Select, Spinner, Switch, Text } from "@appsmith/ads";
import styled from "styled-components";
import OrganizationApi, { type OllamaModel } from "ee/api/OrganizationApi";
import { toast } from "@appsmith/ads";

// Response types (unwrapped by axios interceptors)
interface ExternalReferenceFile {
  filename: string;
  path: string;
}

interface AIConfigData {
  isAIAssistantEnabled?: boolean;
  provider?: string;
  hasClaudeApiKey?: boolean;
  hasOpenaiApiKey?: boolean;
  hasCopilotApiKey?: boolean;
  localLlmUrl?: string;
  localLlmContextSize?: number;
  localLlmModel?: string;
  hasExternalReferenceFiles?: boolean;
  externalReferenceFiles?: ExternalReferenceFile[];
}

interface ApiResponseMeta {
  success: boolean;
  error?: { message: string };
}

interface UnwrappedApiResponse<T> {
  responseMeta: ApiResponseMeta;
  data: T;
}

const Wrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  padding: var(--ads-v2-spaces-7);
  overflow: auto;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-5);
  max-width: 40rem;
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

const HintText = styled(Text)`
  font-style: italic;
`;

const EnabledSwitch = styled.div`
  /* Override switch track color when checked to use green for better visibility */
  input:checked {
    background-color: var(--ads-v2-color-green-600) !important;
  }
  input:checked:hover {
    background-color: var(--ads-v2-color-green-700, #047857) !important;
  }
`;

const TestResultBox = styled.div<{ success?: boolean }>`
  padding: var(--ads-v2-spaces-4);
  border-radius: var(--ads-v2-border-radius);
  background: ${(props) =>
    props.success
      ? "var(--ads-v2-color-bg-success)"
      : "var(--ads-v2-color-bg-error)"};
  border: 1px solid
    ${(props) =>
      props.success
        ? "var(--ads-v2-color-border-success)"
        : "var(--ads-v2-color-border-error)"};
`;

const TestResultDetails = styled.div`
  margin-top: var(--ads-v2-spaces-3);
  padding: var(--ads-v2-spaces-3);
  background: var(--ads-v2-color-bg-subtle);
  border-radius: var(--ads-v2-border-radius);
  font-family: monospace;
  font-size: 12px;
`;

const SuggestionList = styled.ul`
  margin: var(--ads-v2-spaces-2) 0 0 var(--ads-v2-spaces-4);
  padding: 0;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: var(--ads-v2-spaces-3);
  align-items: center;
`;

const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-1);
  margin-top: var(--ads-v2-spaces-2);
`;

const StepItem = styled.div<{ status: "success" | "error" | "pending" }>`
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-2);
  font-size: 13px;
  color: ${(props) =>
    props.status === "success"
      ? "var(--ads-v2-color-fg-success)"
      : props.status === "error"
        ? "var(--ads-v2-color-fg-error)"
        : "var(--ads-v2-color-fg-muted)"};
`;

const ErrorMessage = styled.div`
  margin-top: var(--ads-v2-spaces-3);
  color: var(--ads-v2-color-fg-error);
`;

interface DiagnosticStep {
  name: string;
  status: "success" | "error" | "pending";
  detail?: string;
}

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  warning?: string;
  responseTimeMs?: number;
  httpStatus?: number;
  host?: string;
  port?: number;
  resolvedIp?: string;
  suggestions?: string[];
  steps?: DiagnosticStep[];
  responsePreview?: string;
  testResponse?: string;
}

const ResponsePreview = styled.div`
  margin-top: var(--ads-v2-spaces-3);
  padding: var(--ads-v2-spaces-3);
  background: var(--ads-v2-color-bg-subtle);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  font-family: monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 150px;
  overflow-y: auto;
`;

const ExternalFilesNotice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--ads-v2-spaces-3);
  padding: var(--ads-v2-spaces-4);
  background: linear-gradient(
    135deg,
    var(--ads-v2-color-bg-information) 0%,
    var(--ads-v2-color-bg-information-secondary, var(--ads-v2-color-bg-subtle))
      100%
  );
  border: 1px solid var(--ads-v2-color-border-information);
  border-radius: var(--ads-v2-border-radius);
  margin-bottom: var(--ads-v2-spaces-2);
`;

const NoticeIcon = styled.span`
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
`;

const NoticeContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-1);
`;

const FileList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ads-v2-spaces-2);
  margin-top: var(--ads-v2-spaces-1);
`;

const FileChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: var(--ads-v2-color-bg);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  color: var(--ads-v2-color-fg);
`;

// Context size preset styles
const ContextSizeGroup = styled.div`
  display: flex;
  gap: 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--ads-v2-color-border);
  width: fit-content;
`;

const ContextPresetButton = styled.button<{ isActive: boolean }>`
  padding: 8px 16px;
  border: none;
  background: ${(props) =>
    props.isActive
      ? "var(--ads-v2-color-bg-emphasis)"
      : "var(--ads-v2-color-bg)"};
  color: ${(props) =>
    props.isActive
      ? "var(--ads-v2-color-fg-on-emphasis)"
      : "var(--ads-v2-color-fg)"};
  font-family: "SF Mono", Monaco, "Courier New", monospace;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border-right: 1px solid var(--ads-v2-color-border);

  &:last-child {
    border-right: none;
  }

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.isActive
        ? "var(--ads-v2-color-bg-emphasis-plus)"
        : "var(--ads-v2-color-bg-subtle)"};
  }
`;

const CustomContextInput = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-2);
  margin-top: var(--ads-v2-spaces-2);
`;

// Model selector styles
const ModelSelectWrapper = styled.div<{ isLoading?: boolean }>`
  position: relative;
  opacity: ${(props) => (props.isLoading ? 0.6 : 1)};
  transition: opacity 0.2s ease;
`;

const ModelLoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ads-v2-spaces-2);
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--ads-v2-border-radius);
`;

const ModelRevealWrapper = styled.div<{ isVisible: boolean }>`
  max-height: ${(props) => (props.isVisible ? "200px" : "0")};
  opacity: ${(props) => (props.isVisible ? 1 : 0)};
  overflow: hidden;
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease;
`;

const CONTEXT_PRESETS = [
  { label: "4K", value: 4096 },
  { label: "8K", value: 8192 },
  { label: "16K", value: 16384 },
  { label: "32K", value: 32768 },
  { label: "128K", value: 131072 },
  { label: "Custom", value: "custom" },
] as const;

const STEP_ICONS: Record<"success" | "error" | "pending", string> = {
  success: "\u2713",
  error: "\u2717",
  pending: "\u25CB",
};

function getStepIcon(status: "success" | "error" | "pending"): string {
  return STEP_ICONS[status];
}

interface TestResultDisplayProps {
  result: TestResult;
  successLabel: string;
  failureLabel: string;
  showConnectionDetails?: boolean;
}

function TestResultDisplay({
  failureLabel,
  result,
  showConnectionDetails = false,
  successLabel,
}: TestResultDisplayProps): JSX.Element {
  return (
    <TestResultBox success={result.success}>
      <Text
        color={
          result.success
            ? "var(--ads-v2-color-fg-success)"
            : "var(--ads-v2-color-fg-error)"
        }
        kind="heading-s"
      >
        {result.success ? successLabel : failureLabel}
      </Text>

      {result.steps && result.steps.length > 0 && (
        <StepList>
          {result.steps.map((step, index) => (
            <StepItem key={index} status={step.status}>
              <span>{getStepIcon(step.status)}</span>
              <span>
                {step.name}
                {step.detail && ` - ${step.detail}`}
              </span>
            </StepItem>
          ))}
        </StepList>
      )}

      {result.message && (
        <Text kind="body-s" style={{ marginTop: "8px" }}>
          {result.message}
        </Text>
      )}

      {result.testResponse && (
        <Text
          color="var(--ads-v2-color-fg-muted)"
          kind="body-s"
          style={{ marginTop: "4px" }}
        >
          Response: &quot;{result.testResponse}&quot;
        </Text>
      )}

      {result.error && (
        <ErrorMessage>
          <Text color="var(--ads-v2-color-fg-error)" kind="body-s">
            {result.error}
          </Text>
        </ErrorMessage>
      )}

      {result.warning && (
        <Text
          color="var(--ads-v2-color-fg-warning)"
          kind="body-s"
          style={{ marginTop: "8px" }}
        >
          {"\u26A0"} {result.warning}
        </Text>
      )}

      {showConnectionDetails &&
        (result.host || result.responseTimeMs !== undefined) && (
          <TestResultDetails>
            {result.host && <div>Host: {result.host}</div>}
            {result.resolvedIp && <div>Resolved IP: {result.resolvedIp}</div>}
            {result.port && <div>Port: {result.port}</div>}
            {result.httpStatus && <div>HTTP Status: {result.httpStatus}</div>}
            {result.responseTimeMs !== undefined && (
              <div>Response Time: {result.responseTimeMs}ms</div>
            )}
          </TestResultDetails>
        )}

      {!showConnectionDetails && result.responseTimeMs !== undefined && (
        <TestResultDetails>
          <div>Response Time: {result.responseTimeMs}ms</div>
          {result.httpStatus && <div>HTTP Status: {result.httpStatus}</div>}
        </TestResultDetails>
      )}

      {result.responsePreview && (
        <>
          <Text kind="body-s" style={{ marginTop: "8px", fontWeight: 500 }}>
            Response from {showConnectionDetails ? "server" : "API"}:
          </Text>
          <ResponsePreview>{result.responsePreview}</ResponsePreview>
        </>
      )}

      {result.suggestions && result.suggestions.length > 0 && (
        <>
          <Text kind="body-s" style={{ marginTop: "12px", fontWeight: 500 }}>
            Suggestions:
          </Text>
          <SuggestionList>
            {result.suggestions.map((suggestion, index) => (
              <li key={index}>
                <Text kind="body-s">{suggestion}</Text>
              </li>
            ))}
          </SuggestionList>
        </>
      )}
    </TestResultBox>
  );
}

function ApiKeyTestResult({ result }: { result: TestResult }): JSX.Element {
  return (
    <TestResultDisplay
      failureLabel={"\u2717 API Key Test Failed"}
      result={result}
      successLabel={"\u2713 API Key Valid"}
    />
  );
}

function AISettings() {
  const [provider, setProvider] = useState<string>("CLAUDE");
  const [claudeApiKey, setClaudeApiKey] = useState<string>("");
  const [openaiApiKey, setOpenaiApiKey] = useState<string>("");
  const [copilotApiKey, setCopilotApiKey] = useState<string>("");
  const [localLlmUrl, setLocalLlmUrl] = useState<string>("");
  const [localLlmContextSize, setLocalLlmContextSize] = useState<string>("");
  const [localLlmModel, setLocalLlmModel] = useState<string>("");
  const [isAIAssistantEnabled, setIsAIAssistantEnabled] =
    useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [apiKeyTestResult, setApiKeyTestResult] = useState<TestResult | null>(
    null,
  );
  const [externalReferenceFiles, setExternalReferenceFiles] = useState<
    ExternalReferenceFile[]
  >([]);
  // New state for model selection and context presets
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [contextSizePreset, setContextSizePreset] = useState<string | null>(
    null,
  );

  useEffect(function fetchAIConfigOnMount() {
    const fetchAIConfig = async () => {
      try {
        // Note: response interceptor unwraps axios response, so response = { responseMeta, data }
        const response =
          (await OrganizationApi.getAIConfig()) as unknown as UnwrappedApiResponse<AIConfigData>;

        if (response.responseMeta.success) {
          const config = response.data;

          setIsAIAssistantEnabled(config.isAIAssistantEnabled || false);
          // Empty string means not set - default to CLAUDE
          setProvider(
            config.provider && config.provider !== ""
              ? config.provider
              : "CLAUDE",
          );
          setClaudeApiKey(config.hasClaudeApiKey ? "••••••••" : "");
          setOpenaiApiKey(config.hasOpenaiApiKey ? "••••••••" : "");
          setCopilotApiKey(config.hasCopilotApiKey ? "••••••••" : "");
          setLocalLlmUrl(config.localLlmUrl || "");
          // -1 is sentinel value meaning "not set"
          const contextSize = config.localLlmContextSize;

          setLocalLlmContextSize(
            contextSize && contextSize > 0 ? contextSize.toString() : "",
          );
          setLocalLlmModel(config.localLlmModel || "");

          // Determine context size preset from saved value
          if (contextSize && contextSize > 0) {
            const matchingPreset = CONTEXT_PRESETS.find(
              (p) => p.value === contextSize,
            );

            if (matchingPreset && matchingPreset.value !== "custom") {
              setContextSizePreset(null);
            } else {
              setContextSizePreset("custom");
            }
          }

          // Set external reference files if present
          if (
            config.hasExternalReferenceFiles &&
            config.externalReferenceFiles
          ) {
            setExternalReferenceFiles(config.externalReferenceFiles);
          }
        }
      } catch (error) {
        toast.show("Failed to load AI settings", { kind: "error" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAIConfig();
  }, []);

  const fetchAvailableModels = async (url: string) => {
    if (!url.trim()) return;

    setIsFetchingModels(true);
    try {
      const response = (await OrganizationApi.fetchLlmModels(
        url.trim(),
      )) as unknown as UnwrappedApiResponse<{
        success: boolean;
        models: OllamaModel[];
      }>;

      if (response.responseMeta.success && response.data.success) {
        setAvailableModels(response.data.models || []);
      } else {
        toast.show("Could not fetch available models", { kind: "warning" });
        setAvailableModels([]);
      }
    } catch (error) {
      toast.show("Could not fetch available models", { kind: "warning" });
      setAvailableModels([]);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const request: {
        provider: string;
        isAIAssistantEnabled: boolean;
        claudeApiKey?: string;
        openaiApiKey?: string;
        copilotApiKey?: string;
        localLlmUrl?: string;
        localLlmContextSize?: number;
        localLlmModel?: string;
      } = {
        provider,
        isAIAssistantEnabled,
      };

      if (
        provider === "CLAUDE" &&
        claudeApiKey &&
        claudeApiKey !== "••••••••"
      ) {
        request.claudeApiKey = claudeApiKey;
      }

      if (
        provider === "OPENAI" &&
        openaiApiKey &&
        openaiApiKey !== "••••••••"
      ) {
        request.openaiApiKey = openaiApiKey;
      }

      if (
        provider === "COPILOT" &&
        copilotApiKey &&
        copilotApiKey !== "••••••••"
      ) {
        request.copilotApiKey = copilotApiKey;
      }

      if (provider === "LOCAL_LLM") {
        if (localLlmUrl) {
          request.localLlmUrl = localLlmUrl;
        }

        if (localLlmContextSize) {
          request.localLlmContextSize = parseInt(localLlmContextSize, 10);
        }

        if (localLlmModel) {
          request.localLlmModel = localLlmModel;
        }
      }

      // Note: response interceptor unwraps axios response
      const response = (await OrganizationApi.updateAIConfig(
        request,
      )) as unknown as UnwrappedApiResponse<AIConfigData>;

      if (response.responseMeta.success) {
        toast.show("AI configuration saved successfully", { kind: "success" });

        if (claudeApiKey && claudeApiKey !== "••••••••") {
          setClaudeApiKey("••••••••");
        }

        if (openaiApiKey && openaiApiKey !== "••••••••") {
          setOpenaiApiKey("••••••••");
        }

        if (copilotApiKey && copilotApiKey !== "••••••••") {
          setCopilotApiKey("••••••••");
        }
      } else {
        toast.show("Failed to save AI configuration", { kind: "error" });
      }
    } catch (error) {
      toast.show("Failed to save AI configuration", { kind: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!localLlmUrl.trim()) {
      toast.show("Please enter a URL to test", { kind: "warning" });

      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = (await OrganizationApi.testLlmConnection(
        localLlmUrl.trim(),
      )) as unknown as UnwrappedApiResponse<TestResult>;

      if (response.responseMeta.success) {
        setTestResult(response.data);

        // Auto-fetch models on successful connection
        if (response.data.success) {
          await fetchAvailableModels(localLlmUrl);
        }
      } else {
        setTestResult({
          success: false,
          error: "Failed to test connection",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: "Failed to test connection - server error",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestApiKey = async () => {
    setIsTestingApiKey(true);
    setApiKeyTestResult(null);

    try {
      // Pass the current key if it's been modified (not the masked placeholder)
      let keyToTest: string | undefined;

      if (provider === "CLAUDE") {
        keyToTest = claudeApiKey !== "••••••••" ? claudeApiKey : undefined;
      } else if (provider === "OPENAI") {
        keyToTest = openaiApiKey !== "••••••••" ? openaiApiKey : undefined;
      } else if (provider === "COPILOT") {
        keyToTest = copilotApiKey !== "••••••••" ? copilotApiKey : undefined;
      }

      const response = (await OrganizationApi.testApiKey(
        provider,
        keyToTest,
      )) as unknown as UnwrappedApiResponse<TestResult>;

      if (response.responseMeta.success) {
        setApiKeyTestResult(response.data);
      } else {
        setApiKeyTestResult({
          success: false,
          error: "Failed to test API key",
        });
      }
    } catch (error) {
      setApiKeyTestResult({
        success: false,
        error: "Failed to test API key - server error",
      });
    } finally {
      setIsTestingApiKey(false);
    }
  };

  if (isLoading) {
    return <Wrapper>Loading...</Wrapper>;
  }

  return (
    <Wrapper>
      <ContentWrapper>
        <Text kind="heading-l" renderAs="h1">
          AI Assistant Configuration
        </Text>
        <Text color="var(--ads-v2-color-fg-muted)" kind="body-m">
          Configure AI assistant for your organization. API keys are encrypted
          and stored securely. Only organization administrators can configure
          these settings.
        </Text>

        {externalReferenceFiles.length > 0 && (
          <ExternalFilesNotice>
            <NoticeIcon>📁</NoticeIcon>
            <NoticeContent>
              <Text kind="body-m" style={{ fontWeight: 500 }}>
                Custom AI Context Files Active
              </Text>
              <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
                External reference files are being used instead of system
                defaults. These customize the AI assistant&apos;s knowledge for
                your environment.
              </Text>
              <FileList>
                {externalReferenceFiles.map((file) => (
                  <FileChip key={file.filename} title={file.path}>
                    {file.filename}
                  </FileChip>
                ))}
              </FileList>
            </NoticeContent>
          </ExternalFilesNotice>
        )}

        <FieldWrapper>
          <LabelWrapper>
            <EnabledSwitch>
              <Switch
                isSelected={isAIAssistantEnabled}
                onChange={function handleAIToggle(value) {
                  setIsAIAssistantEnabled(value);
                }}
              >
                <Text kind="body-m">Enable AI Assistant</Text>
              </Switch>
            </EnabledSwitch>
          </LabelWrapper>
          <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
            When enabled, all users in your organization can use AI assistance
            in JavaScript modules and queries.
          </Text>
        </FieldWrapper>

        <FieldWrapper>
          <LabelWrapper>
            <Text kind="body-m">AI Provider</Text>
          </LabelWrapper>
          <Select
            onChange={function handleProviderChange(value) {
              setProvider(value as string);
              setApiKeyTestResult(null);
              setTestResult(null);
            }}
            options={[
              { label: "Claude (Anthropic)", value: "CLAUDE" },
              { label: "OpenAI (ChatGPT)", value: "OPENAI" },
              { label: "MS Copilot (Azure)", value: "COPILOT" },
              { label: "Use Local LLM", value: "LOCAL_LLM" },
            ]}
            value={provider}
          />
        </FieldWrapper>

        {provider === "CLAUDE" && (
          <FieldWrapper>
            <LabelWrapper>
              <Text kind="body-m">Claude API Key</Text>
            </LabelWrapper>
            <Input
              onChange={function handleClaudeKeyChange(value) {
                setClaudeApiKey(value);
                setApiKeyTestResult(null);
              }}
              placeholder="Enter Claude API key (leave blank to keep existing)"
              type="password"
              value={claudeApiKey}
            />
            <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
              Get your API key from https://console.anthropic.com/
            </Text>

            <ButtonRow style={{ marginTop: "8px" }}>
              <Button
                isDisabled={!claudeApiKey}
                isLoading={isTestingApiKey}
                kind="secondary"
                onClick={handleTestApiKey}
                size="sm"
              >
                Test Key
              </Button>
              {isTestingApiKey && (
                <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
                  Testing API key...
                </Text>
              )}
            </ButtonRow>

            {apiKeyTestResult && <ApiKeyTestResult result={apiKeyTestResult} />}
          </FieldWrapper>
        )}

        {provider === "OPENAI" && (
          <FieldWrapper>
            <LabelWrapper>
              <Text kind="body-m">OpenAI API Key</Text>
            </LabelWrapper>
            <Input
              onChange={function handleOpenAIKeyChange(value) {
                setOpenaiApiKey(value);
                setApiKeyTestResult(null);
              }}
              placeholder="Enter OpenAI API key (leave blank to keep existing)"
              type="password"
              value={openaiApiKey}
            />
            <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
              Get your API key from https://platform.openai.com/api-keys
            </Text>

            <ButtonRow style={{ marginTop: "8px" }}>
              <Button
                isDisabled={!openaiApiKey}
                isLoading={isTestingApiKey}
                kind="secondary"
                onClick={handleTestApiKey}
                size="sm"
              >
                Test Key
              </Button>
              {isTestingApiKey && (
                <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
                  Testing API key...
                </Text>
              )}
            </ButtonRow>

            {apiKeyTestResult && <ApiKeyTestResult result={apiKeyTestResult} />}
          </FieldWrapper>
        )}

        {provider === "COPILOT" && (
          <FieldWrapper>
            <LabelWrapper>
              <Text kind="body-m">MS Copilot API Key</Text>
            </LabelWrapper>
            <Input
              onChange={function handleCopilotKeyChange(value) {
                setCopilotApiKey(value);
                setApiKeyTestResult(null);
              }}
              placeholder="Enter MS Copilot API key (leave blank to keep existing)"
              type="password"
              value={copilotApiKey}
            />
            <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
              Get your API key from https://portal.azure.com/ (Azure OpenAI
              Service)
            </Text>

            <ButtonRow style={{ marginTop: "8px" }}>
              <Button
                isDisabled={!copilotApiKey}
                isLoading={isTestingApiKey}
                kind="secondary"
                onClick={handleTestApiKey}
                size="sm"
              >
                Test Key
              </Button>
              {isTestingApiKey && (
                <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
                  Testing API key...
                </Text>
              )}
            </ButtonRow>

            {apiKeyTestResult && <ApiKeyTestResult result={apiKeyTestResult} />}
          </FieldWrapper>
        )}

        {provider === "LOCAL_LLM" && (
          <>
            <FieldWrapper>
              <LabelWrapper>
                <Text kind="body-m">Local LLM URL</Text>
              </LabelWrapper>
              <Input
                onChange={function handleLocalLlmUrlChange(value) {
                  setLocalLlmUrl(value);
                  // Reset models when URL changes
                  setAvailableModels([]);
                  setLocalLlmModel("");
                  setTestResult(null);
                }}
                placeholder="http://localhost:11434/api/generate"
                type="text"
                value={localLlmUrl}
              />
              <HintText color="var(--ads-v2-color-fg-muted)" kind="body-s">
                Enter your Ollama endpoint URL (e.g.,
                http://localhost:11434/api/generate)
              </HintText>
            </FieldWrapper>

            <FieldWrapper>
              <ButtonRow>
                <Button
                  isDisabled={!localLlmUrl.trim()}
                  isLoading={isTesting || isFetchingModels}
                  kind="secondary"
                  onClick={handleTestConnection}
                  size="md"
                >
                  Test Connection
                </Button>
                {isTesting && (
                  <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
                    Testing connection from server...
                  </Text>
                )}
              </ButtonRow>

              {testResult && (
                <TestResultDisplay
                  failureLabel={"\u2717 Connection Failed"}
                  result={testResult}
                  showConnectionDetails
                  successLabel={"\u2713 Connection Successful"}
                />
              )}
            </FieldWrapper>

            {/* Model Selection - Only shown after successful connection */}
            <ModelRevealWrapper
              isVisible={testResult?.success || availableModels.length > 0}
            >
              <FieldWrapper>
                <LabelWrapper>
                  <Text kind="body-m">Model</Text>
                </LabelWrapper>
                <ModelSelectWrapper isLoading={isFetchingModels}>
                  <Select
                    isDisabled={
                      isFetchingModels || availableModels.length === 0
                    }
                    onChange={function handleModelChange(value) {
                      setLocalLlmModel(value as string);
                    }}
                    options={availableModels.map((model) => ({
                      label: model.details?.parameter_size
                        ? `${model.name} (${model.details.parameter_size})`
                        : model.name,
                      value: model.name,
                    }))}
                    placeholder={
                      isFetchingModels ? "Loading models..." : "Select a model"
                    }
                    value={localLlmModel}
                  />
                  {isFetchingModels && (
                    <ModelLoadingOverlay>
                      <Spinner size="sm" />
                      <Text kind="body-s">Fetching models...</Text>
                    </ModelLoadingOverlay>
                  )}
                </ModelSelectWrapper>
                {availableModels.length === 0 &&
                  !isFetchingModels &&
                  testResult?.success && (
                    <Text color="var(--ads-v2-color-fg-warning)" kind="body-s">
                      No models found. Make sure Ollama has models installed
                      (run: ollama pull llama3.2)
                    </Text>
                  )}
              </FieldWrapper>
            </ModelRevealWrapper>

            {/* Context Size with Presets */}
            <FieldWrapper>
              <LabelWrapper>
                <Text kind="body-m">Context Size</Text>
              </LabelWrapper>
              <ContextSizeGroup>
                {CONTEXT_PRESETS.map((preset) => (
                  <ContextPresetButton
                    isActive={
                      preset.value === "custom"
                        ? contextSizePreset === "custom"
                        : localLlmContextSize === String(preset.value)
                    }
                    key={preset.label}
                    onClick={function handlePresetClick() {
                      if (preset.value === "custom") {
                        setContextSizePreset("custom");
                      } else {
                        setContextSizePreset(null);
                        setLocalLlmContextSize(String(preset.value));
                      }
                    }}
                    type="button"
                  >
                    {preset.label}
                  </ContextPresetButton>
                ))}
              </ContextSizeGroup>

              {contextSizePreset === "custom" && (
                <CustomContextInput>
                  <Input
                    onChange={function handleCustomContextChange(value) {
                      setLocalLlmContextSize(value);
                    }}
                    placeholder="Enter custom size (tokens)"
                    style={{ width: "200px" }}
                    type="number"
                    value={localLlmContextSize}
                  />
                  <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
                    tokens
                  </Text>
                </CustomContextInput>
              )}

              <Text
                color="var(--ads-v2-color-fg-muted)"
                kind="body-s"
                style={{ marginTop: "8px" }}
              >
                Maximum context window size. Larger values use more memory but
                allow longer conversations.
              </Text>
            </FieldWrapper>
          </>
        )}

        <FieldWrapper>
          <Button
            isLoading={isSaving}
            kind="primary"
            onClick={function handleSaveClick() {
              handleSave();
            }}
            size="md"
          >
            Save Configuration
          </Button>
        </FieldWrapper>
      </ContentWrapper>
    </Wrapper>
  );
}

export default AISettings;
