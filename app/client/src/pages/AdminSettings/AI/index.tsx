import React, { useState, useEffect } from "react";
import { Button, Input, Select, Switch, Text } from "@appsmith/ads";
import styled from "styled-components";
import OrganizationApi from "ee/api/OrganizationApi";
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

function getStepIcon(status: "success" | "error" | "pending"): string {
  if (status === "success") return "\u2713";

  if (status === "error") return "\u2717";

  return "\u25CB";
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
                }}
                placeholder="http://localhost:11434/api/generate"
                type="text"
                value={localLlmUrl}
              />
              <HintText color="var(--ads-v2-color-fg-muted)" kind="body-s">
                The URL should typically end with /generate or /chat (e.g.,
                Ollama uses /api/generate), but this may vary by provider.
              </HintText>
            </FieldWrapper>

            <FieldWrapper>
              <LabelWrapper>
                <Text kind="body-m">Context Size</Text>
              </LabelWrapper>
              <Input
                onChange={function handleContextSizeChange(value) {
                  setLocalLlmContextSize(value);
                }}
                placeholder="4096"
                type="number"
                value={localLlmContextSize}
              />
              <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
                Maximum context window size in tokens. Check your model
                documentation for recommended values.
              </Text>
            </FieldWrapper>

            <FieldWrapper>
              <ButtonRow>
                <Button
                  isDisabled={!localLlmUrl.trim()}
                  isLoading={isTesting}
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
