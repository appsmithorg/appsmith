import React, { useState, useEffect } from "react";
import { Button, Input, Select, Switch, Text } from "@appsmith/ads";
import styled from "styled-components";
import OrganizationApi from "ee/api/OrganizationApi";
import { toast } from "@appsmith/ads";

// Response types (unwrapped by axios interceptors)
interface AIConfigData {
  isAIAssistantEnabled?: boolean;
  provider?: string;
  hasClaudeApiKey?: boolean;
  hasOpenaiApiKey?: boolean;
  localLlmUrl?: string;
  localLlmContextSize?: number;
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

function AISettings() {
  const [provider, setProvider] = useState<string>("CLAUDE");
  const [claudeApiKey, setClaudeApiKey] = useState<string>("");
  const [openaiApiKey, setOpenaiApiKey] = useState<string>("");
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
          setLocalLlmUrl(config.localLlmUrl || "");
          // -1 is sentinel value meaning "not set"
          const contextSize = config.localLlmContextSize;

          setLocalLlmContextSize(
            contextSize && contextSize > 0 ? contextSize.toString() : "",
          );
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
      const keyToTest =
        provider === "CLAUDE"
          ? claudeApiKey !== "••••••••"
            ? claudeApiKey
            : undefined
          : openaiApiKey !== "••••••••"
            ? openaiApiKey
            : undefined;

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

        <FieldWrapper>
          <LabelWrapper>
            <Switch
              isSelected={isAIAssistantEnabled}
              onChange={function handleAIToggle(value) {
                setIsAIAssistantEnabled(value);
              }}
            >
              <Text kind="body-m">Enable AI Assistant</Text>
            </Switch>
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

            {apiKeyTestResult && (
              <TestResultBox success={apiKeyTestResult.success}>
                <Text
                  color={
                    apiKeyTestResult.success
                      ? "var(--ads-v2-color-fg-success)"
                      : "var(--ads-v2-color-fg-error)"
                  }
                  kind="heading-s"
                >
                  {apiKeyTestResult.success
                    ? "✓ API Key Valid"
                    : "✗ API Key Test Failed"}
                </Text>

                {apiKeyTestResult.steps &&
                  apiKeyTestResult.steps.length > 0 && (
                    <StepList>
                      {apiKeyTestResult.steps.map((step, index) => (
                        <StepItem key={index} status={step.status}>
                          <span>
                            {step.status === "success"
                              ? "✓"
                              : step.status === "error"
                                ? "✗"
                                : "○"}
                          </span>
                          <span>
                            {step.name}
                            {step.detail && ` - ${step.detail}`}
                          </span>
                        </StepItem>
                      ))}
                    </StepList>
                  )}

                {apiKeyTestResult.message && (
                  <Text kind="body-s" style={{ marginTop: "8px" }}>
                    {apiKeyTestResult.message}
                  </Text>
                )}

                {(apiKeyTestResult as TestResult & { testResponse?: string })
                  .testResponse && (
                  <Text
                    color="var(--ads-v2-color-fg-muted)"
                    kind="body-s"
                    style={{ marginTop: "4px" }}
                  >
                    Response: &quot;
                    {
                      (
                        apiKeyTestResult as TestResult & {
                          testResponse?: string;
                        }
                      ).testResponse
                    }
                    &quot;
                  </Text>
                )}

                {apiKeyTestResult.error && (
                  <ErrorMessage>
                    <Text color="var(--ads-v2-color-fg-error)" kind="body-s">
                      {apiKeyTestResult.error}
                    </Text>
                  </ErrorMessage>
                )}

                {apiKeyTestResult.responseTimeMs !== undefined && (
                  <TestResultDetails>
                    <div>
                      Response Time: {apiKeyTestResult.responseTimeMs}ms
                    </div>
                    {apiKeyTestResult.httpStatus && (
                      <div>HTTP Status: {apiKeyTestResult.httpStatus}</div>
                    )}
                  </TestResultDetails>
                )}

                {apiKeyTestResult.responsePreview && (
                  <>
                    <Text
                      kind="body-s"
                      style={{ marginTop: "8px", fontWeight: 500 }}
                    >
                      Response from API:
                    </Text>
                    <ResponsePreview>
                      {apiKeyTestResult.responsePreview}
                    </ResponsePreview>
                  </>
                )}

                {apiKeyTestResult.suggestions &&
                  apiKeyTestResult.suggestions.length > 0 && (
                    <>
                      <Text
                        kind="body-s"
                        style={{ marginTop: "12px", fontWeight: 500 }}
                      >
                        Suggestions:
                      </Text>
                      <SuggestionList>
                        {apiKeyTestResult.suggestions.map(
                          (suggestion, index) => (
                            <li key={index}>
                              <Text kind="body-s">{suggestion}</Text>
                            </li>
                          ),
                        )}
                      </SuggestionList>
                    </>
                  )}
              </TestResultBox>
            )}
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

            {apiKeyTestResult && (
              <TestResultBox success={apiKeyTestResult.success}>
                <Text
                  color={
                    apiKeyTestResult.success
                      ? "var(--ads-v2-color-fg-success)"
                      : "var(--ads-v2-color-fg-error)"
                  }
                  kind="heading-s"
                >
                  {apiKeyTestResult.success
                    ? "✓ API Key Valid"
                    : "✗ API Key Test Failed"}
                </Text>

                {apiKeyTestResult.steps &&
                  apiKeyTestResult.steps.length > 0 && (
                    <StepList>
                      {apiKeyTestResult.steps.map((step, index) => (
                        <StepItem key={index} status={step.status}>
                          <span>
                            {step.status === "success"
                              ? "✓"
                              : step.status === "error"
                                ? "✗"
                                : "○"}
                          </span>
                          <span>
                            {step.name}
                            {step.detail && ` - ${step.detail}`}
                          </span>
                        </StepItem>
                      ))}
                    </StepList>
                  )}

                {apiKeyTestResult.message && (
                  <Text kind="body-s" style={{ marginTop: "8px" }}>
                    {apiKeyTestResult.message}
                  </Text>
                )}

                {(apiKeyTestResult as TestResult & { testResponse?: string })
                  .testResponse && (
                  <Text
                    color="var(--ads-v2-color-fg-muted)"
                    kind="body-s"
                    style={{ marginTop: "4px" }}
                  >
                    Response: &quot;
                    {
                      (
                        apiKeyTestResult as TestResult & {
                          testResponse?: string;
                        }
                      ).testResponse
                    }
                    &quot;
                  </Text>
                )}

                {apiKeyTestResult.error && (
                  <ErrorMessage>
                    <Text color="var(--ads-v2-color-fg-error)" kind="body-s">
                      {apiKeyTestResult.error}
                    </Text>
                  </ErrorMessage>
                )}

                {apiKeyTestResult.responseTimeMs !== undefined && (
                  <TestResultDetails>
                    <div>
                      Response Time: {apiKeyTestResult.responseTimeMs}ms
                    </div>
                    {apiKeyTestResult.httpStatus && (
                      <div>HTTP Status: {apiKeyTestResult.httpStatus}</div>
                    )}
                  </TestResultDetails>
                )}

                {apiKeyTestResult.responsePreview && (
                  <>
                    <Text
                      kind="body-s"
                      style={{ marginTop: "8px", fontWeight: 500 }}
                    >
                      Response from API:
                    </Text>
                    <ResponsePreview>
                      {apiKeyTestResult.responsePreview}
                    </ResponsePreview>
                  </>
                )}

                {apiKeyTestResult.suggestions &&
                  apiKeyTestResult.suggestions.length > 0 && (
                    <>
                      <Text
                        kind="body-s"
                        style={{ marginTop: "12px", fontWeight: 500 }}
                      >
                        Suggestions:
                      </Text>
                      <SuggestionList>
                        {apiKeyTestResult.suggestions.map(
                          (suggestion, index) => (
                            <li key={index}>
                              <Text kind="body-s">{suggestion}</Text>
                            </li>
                          ),
                        )}
                      </SuggestionList>
                    </>
                  )}
              </TestResultBox>
            )}
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
                <TestResultBox success={testResult.success}>
                  <Text
                    color={
                      testResult.success
                        ? "var(--ads-v2-color-fg-success)"
                        : "var(--ads-v2-color-fg-error)"
                    }
                    kind="heading-s"
                  >
                    {testResult.success
                      ? "✓ Connection Successful"
                      : "✗ Connection Failed"}
                  </Text>

                  {/* Diagnostic Steps */}
                  {testResult.steps && testResult.steps.length > 0 && (
                    <StepList>
                      {testResult.steps.map((step, index) => (
                        <StepItem key={index} status={step.status}>
                          <span>
                            {step.status === "success"
                              ? "✓"
                              : step.status === "error"
                                ? "✗"
                                : "○"}
                          </span>
                          <span>
                            {step.name}
                            {step.detail && ` - ${step.detail}`}
                          </span>
                        </StepItem>
                      ))}
                    </StepList>
                  )}

                  {testResult.error && (
                    <ErrorMessage>
                      <Text color="var(--ads-v2-color-fg-error)" kind="body-s">
                        {testResult.error}
                      </Text>
                    </ErrorMessage>
                  )}

                  {testResult.warning && (
                    <Text
                      color="var(--ads-v2-color-fg-warning)"
                      kind="body-s"
                      style={{ marginTop: "8px" }}
                    >
                      ⚠ {testResult.warning}
                    </Text>
                  )}

                  {/* Show details only if we have some */}
                  {(testResult.host ||
                    testResult.responseTimeMs !== undefined) && (
                    <TestResultDetails>
                      {testResult.host && <div>Host: {testResult.host}</div>}
                      {testResult.resolvedIp && (
                        <div>Resolved IP: {testResult.resolvedIp}</div>
                      )}
                      {testResult.port && <div>Port: {testResult.port}</div>}
                      {testResult.httpStatus && (
                        <div>HTTP Status: {testResult.httpStatus}</div>
                      )}
                      {testResult.responseTimeMs !== undefined && (
                        <div>Response Time: {testResult.responseTimeMs}ms</div>
                      )}
                    </TestResultDetails>
                  )}

                  {/* Show response preview if available */}
                  {testResult.responsePreview && (
                    <>
                      <Text
                        kind="body-s"
                        style={{ marginTop: "12px", fontWeight: 500 }}
                      >
                        Response from server:
                      </Text>
                      <ResponsePreview>
                        {testResult.responsePreview}
                      </ResponsePreview>
                    </>
                  )}

                  {testResult.suggestions &&
                    testResult.suggestions.length > 0 && (
                      <>
                        <Text
                          kind="body-s"
                          style={{ marginTop: "12px", fontWeight: 500 }}
                        >
                          Suggestions:
                        </Text>
                        <SuggestionList>
                          {testResult.suggestions.map((suggestion, index) => (
                            <li key={index}>
                              <Text kind="body-s">{suggestion}</Text>
                            </li>
                          ))}
                        </SuggestionList>
                      </>
                    )}
                </TestResultBox>
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
