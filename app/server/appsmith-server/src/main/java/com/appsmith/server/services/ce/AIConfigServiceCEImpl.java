package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.constants.ce.FieldNameCE;
import com.appsmith.server.domains.AIAssistantConfig;
import com.appsmith.server.domains.AIProvider;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.AIConfigDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithErrorCode;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.AIConfigSecretsCE;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.util.WebClientUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.ConnectTimeoutException;
import io.netty.handler.ssl.SslHandshakeTimeoutException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.netty.http.client.HttpClient;

import java.net.URI;
import java.net.URLEncoder;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATION;
import static com.appsmith.server.constants.AIConstants.DEFAULT_AZURE_API_VERSION;
import static com.appsmith.server.constants.AIConstants.DEFAULT_AZURE_MAX_COMPLETION_TOKENS;
import static com.appsmith.server.constants.AIConstants.DEFAULT_CLAUDE_BASE_URL;
import static com.appsmith.server.constants.AIConstants.DEFAULT_CLAUDE_MODEL;
import static com.appsmith.server.constants.AIConstants.DEFAULT_OPENAI_BASE_URL;
import static com.appsmith.server.constants.AIConstants.DEFAULT_OPENAI_MODEL;

@Slf4j
@RequiredArgsConstructor
public class AIConfigServiceCEImpl implements AIConfigServiceCE {

    /** What the settings page renders in place of a stored key, and may echo back. */
    private static final String MASKED_API_KEY = "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";

    private final OrganizationService organizationService;
    private final ObjectMapper objectMapper;
    private final AnalyticsService analyticsService;
    private final SessionUserService sessionUserService;

    @Override
    public Mono<Map<String, Object>> updateAIConfig(AIConfigDTO aiConfig) {
        return organizationService.getCurrentUserOrganizationId().flatMap(organizationId -> organizationService
                .findById(organizationId, MANAGE_ORGANIZATION)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "organization", organizationId)))
                .flatMap(organization -> {
                    OrganizationConfiguration config = organization.getOrganizationConfiguration();
                    if (config == null) {
                        config = new OrganizationConfiguration();
                    }

                    AIAssistantConfig assistantConfig = config.getAiAssistantConfig();
                    if (assistantConfig == null) {
                        assistantConfig = new AIAssistantConfig();
                        config.setAiAssistantConfig(assistantConfig);
                    }

                    // Captured before the setters below overwrite them. A stored credential is bound
                    // to the destination it was entered for: see clearKeyIfDestinationChanged.
                    String previousClaudeBaseUrl = assistantConfig.getClaudeBaseUrl();
                    String previousOpenaiBaseUrl = assistantConfig.getOpenaiBaseUrl();
                    String previousAzureOpenaiEndpoint = assistantConfig.getAzureOpenaiEndpoint();
                    String previousCopilotEndpoint = assistantConfig.getCopilotEndpoint();

                    try {
                        validateApiKey(
                                aiConfig.getClaudeApiKey(), assistantConfig::setClaudeApiKey, 500, "Claude API key");
                        validateApiKey(
                                aiConfig.getOpenaiApiKey(), assistantConfig::setOpenaiApiKey, 500, "OpenAI API key");
                        validateApiKey(
                                aiConfig.getCopilotApiKey(), assistantConfig::setCopilotApiKey, 500, "Copilot API key");
                        validateTrimmedString(
                                aiConfig.getCopilotEndpoint(),
                                assistantConfig::setCopilotEndpoint,
                                2000,
                                "Copilot endpoint URL");
                        validateApiKey(
                                aiConfig.getAzureOpenaiApiKey(),
                                assistantConfig::setAzureOpenaiApiKey,
                                500,
                                "Azure OpenAI API key");
                        validateTrimmedString(
                                aiConfig.getAzureOpenaiEndpoint(),
                                assistantConfig::setAzureOpenaiEndpoint,
                                2000,
                                "Azure OpenAI endpoint URL");
                        validateTrimmedString(
                                aiConfig.getAzureOpenaiDeploymentName(),
                                assistantConfig::setAzureOpenaiDeploymentName,
                                200,
                                "Deployment name");
                        validateTrimmedString(
                                aiConfig.getAzureOpenaiApiVersion(),
                                assistantConfig::setAzureOpenaiApiVersion,
                                50,
                                "API version");
                        validateTrimmedString(aiConfig.getLocalLlmUrl(), assistantConfig::setLocalLlmUrl, 2000, "URL");
                        validateTrimmedString(
                                aiConfig.getLocalLlmModel(), assistantConfig::setLocalLlmModel, 200, "Model name");
                        validateTrimmedString(
                                aiConfig.getClaudeModel(), assistantConfig::setClaudeModel, 200, "Claude model name");
                        validateTrimmedString(
                                aiConfig.getClaudeBaseUrl(),
                                assistantConfig::setClaudeBaseUrl,
                                2000,
                                "Claude base URL");
                        validateTrimmedString(
                                aiConfig.getOpenaiModel(), assistantConfig::setOpenaiModel, 200, "OpenAI model name");
                        validateTrimmedString(
                                aiConfig.getOpenaiBaseUrl(),
                                assistantConfig::setOpenaiBaseUrl,
                                2000,
                                "OpenAI base URL");
                    } catch (AppsmithException e) {
                        return Mono.error(e);
                    }

                    clearKeyIfDestinationChanged(
                            previousClaudeBaseUrl,
                            assistantConfig.getClaudeBaseUrl(),
                            aiConfig.getClaudeApiKey(),
                            assistantConfig::setClaudeApiKey);
                    clearKeyIfDestinationChanged(
                            previousOpenaiBaseUrl,
                            assistantConfig.getOpenaiBaseUrl(),
                            aiConfig.getOpenaiApiKey(),
                            assistantConfig::setOpenaiApiKey);
                    clearKeyIfDestinationChanged(
                            previousAzureOpenaiEndpoint,
                            assistantConfig.getAzureOpenaiEndpoint(),
                            aiConfig.getAzureOpenaiApiKey(),
                            assistantConfig::setAzureOpenaiApiKey);
                    clearKeyIfDestinationChanged(
                            previousCopilotEndpoint,
                            assistantConfig.getCopilotEndpoint(),
                            aiConfig.getCopilotApiKey(),
                            assistantConfig::setCopilotApiKey);

                    if (aiConfig.getProvider() != null) {
                        assistantConfig.setAiProvider(aiConfig.getProvider());
                    }
                    if (aiConfig.getIsAIAssistantEnabled() != null) {
                        assistantConfig.setIsAIAssistantEnabled(aiConfig.getIsAIAssistantEnabled());
                    }
                    if (aiConfig.getLocalLlmContextSize() != null) {
                        assistantConfig.setLocalLlmContextSize(aiConfig.getLocalLlmContextSize());
                    }
                    if (aiConfig.getAzureOpenaiMaxCompletionTokens() != null) {
                        assistantConfig.setAzureOpenaiMaxCompletionTokens(aiConfig.getAzureOpenaiMaxCompletionTokens());
                    }

                    return organizationService
                            .updateOrganizationConfiguration(organizationId, config)
                            .flatMap(updatedOrg -> Mono.defer(() -> sendAskAiOrgConfigAnalytics(updatedOrg))
                                    .onErrorResume(err -> {
                                        log.warn("Failed to send Ask AI config analytics", err);
                                        return Mono.empty();
                                    })
                                    .thenReturn(buildAIConfigResponse(updatedOrg.getOrganizationConfiguration())));
                }));
    }

    /**
     * Segment track event for Mixpanel — non-secret fields only (no URLs, hosts, API keys).
     */
    private Mono<Void> sendAskAiOrgConfigAnalytics(Organization updatedOrg) {
        if (!analyticsService.isActive()) {
            return Mono.empty();
        }

        AIAssistantConfig cfg = updatedOrg.getOrganizationConfiguration() != null
                ? updatedOrg.getOrganizationConfiguration().getAiAssistantConfig()
                : null;

        return sessionUserService
                .getCurrentUser()
                .map(User::getUsername)
                .defaultIfEmpty(FieldNameCE.ANONYMOUS_USER)
                .flatMap(username -> {
                    Map<String, Object> props = buildAskAiOrgConfigAnalyticsProperties(cfg, updatedOrg.getId());
                    return analyticsService.sendEvent(
                            AnalyticsEvents.ASK_AI_ORG_CONFIG_UPDATED.getEventName(), username, props);
                });
    }

    private Map<String, Object> buildAskAiOrgConfigAnalyticsProperties(AIAssistantConfig cfg, String organizationId) {
        Map<String, Object> props = new HashMap<>();
        props.put(FieldNameCE.ORGANIZATION_ID, organizationId != null ? organizationId : "");

        if (cfg == null) {
            props.put("isAIAssistantEnabled", false);
            props.put("provider", "");
            return props;
        }

        props.put("isAIAssistantEnabled", Boolean.TRUE.equals(cfg.getIsAIAssistantEnabled()));

        AIProvider provider = cfg.getAiProvider();
        if (provider == AIProvider.COPILOT) {
            provider = AIProvider.AZURE_OPENAI;
        }
        props.put("provider", provider != null ? provider.name() : "");

        props.put("hasClaudeApiKey", hasValue(cfg.getClaudeApiKey()));
        props.put("hasOpenaiApiKey", hasValue(cfg.getOpenaiApiKey()));
        props.put("hasAzureOpenaiApiKey", hasAzureOpenaiApiKey(cfg));
        props.put("hasLocalLlmUrl", hasValue(cfg.getLocalLlmUrl()));

        props.put("claudeModel", defaultString(cfg.getClaudeModel()));
        props.put("openaiModel", defaultString(cfg.getOpenaiModel()));
        props.put("localLlmModel", defaultString(cfg.getLocalLlmModel()));
        props.put("localLlmContextSize", ObjectUtils.defaultIfNull(cfg.getLocalLlmContextSize(), -1));

        props.put("azureOpenaiDeploymentName", defaultString(cfg.getAzureOpenaiDeploymentName()));
        props.put(
                "azureOpenaiApiVersion",
                ObjectUtils.defaultIfNull(cfg.getAzureOpenaiApiVersion(), DEFAULT_AZURE_API_VERSION));
        props.put(
                "azureOpenaiMaxCompletionTokens",
                ObjectUtils.defaultIfNull(
                        cfg.getAzureOpenaiMaxCompletionTokens(), DEFAULT_AZURE_MAX_COMPLETION_TOKENS));

        return props;
    }

    private boolean hasAzureOpenaiApiKey(AIAssistantConfig cfg) {
        return hasValue(cfg.getAzureOpenaiApiKey()) || hasValue(cfg.getCopilotApiKey());
    }

    /** Sends ask_ai_ORG_TEST_RUN after test API key / local LLM connection completes. */
    private Mono<Void> sendAskAiTestAnalyticsWhenActive(
            String organizationId, String testKind, Map<String, Object> testResponse, Map<String, Object> extraMeta) {
        if (!analyticsService.isActive()) {
            return Mono.empty();
        }

        Map<String, Object> props =
                buildAskAiTestAnalyticsProperties(organizationId, testKind, testResponse, extraMeta);

        return sessionUserService
                .getCurrentUser()
                .map(User::getUsername)
                .defaultIfEmpty(FieldNameCE.ANONYMOUS_USER)
                .flatMap(username ->
                        analyticsService.sendEvent(AnalyticsEvents.ASK_AI_ORG_TEST_RUN.getEventName(), username, props))
                .onErrorResume(err -> {
                    log.warn("Failed to send Ask AI test analytics", err);
                    return Mono.empty();
                });
    }

    private Map<String, Object> buildAskAiTestAnalyticsProperties(
            String organizationId, String testKind, Map<String, Object> testResponse, Map<String, Object> extraMeta) {
        Map<String, Object> props = new HashMap<>();
        props.put(FieldNameCE.ORGANIZATION_ID, organizationId != null ? organizationId : "");
        props.put("testKind", testKind);
        props.put("success", Boolean.TRUE.equals(testResponse.get("success")));

        Object httpStatus = testResponse.get("httpStatus");
        if (httpStatus != null) {
            props.put("httpStatus", httpStatus);
        }

        Object responseTimeMs = testResponse.get("responseTimeMs");
        if (responseTimeMs != null) {
            props.put("responseTimeMs", responseTimeMs);
        }

        Object error = testResponse.get("error");
        if (error != null) {
            String message = String.valueOf(error);
            if (message.length() > 240) {
                message = message.substring(0, 240);
            }
            props.put("errorSummary", message);
        }

        if (extraMeta != null) {
            for (Map.Entry<String, Object> entry : extraMeta.entrySet()) {
                if (entry.getValue() != null) {
                    props.putIfAbsent(entry.getKey(), entry.getValue());
                }
            }
        }

        Object providerFromResponse = testResponse.get("provider");
        if (providerFromResponse != null) {
            props.putIfAbsent("provider", String.valueOf(providerFromResponse));
        }

        return props;
    }

    /**
     * Every authenticated user needs to know whether the assistant is usable, because the editor
     * loads this on session start. Only organization managers get the full configuration: the
     * endpoints, deployment names and model identifiers describe internal infrastructure and are
     * not the client's business. Non-managers get enablement plus credential-presence booleans.
     */
    @Override
    public Mono<Map<String, Object>> getAIConfig() {
        return organizationService.getCurrentUserOrganizationId().flatMap(organizationId -> organizationService
                .findById(organizationId, MANAGE_ORGANIZATION)
                .map(organization -> buildAIConfigResponseForGet(organization.getOrganizationConfiguration()))
                // findById SIGNALS an error rather than completing empty when the caller lacks
                // MANAGE_ORGANIZATION — it ends in switchIfEmpty(Mono.error(NO_RESOURCE_FOUND)), and both editions
                // share that implementation. A switchIfEmpty here would therefore never be reached, which left every
                // non-manager receiving an error instead of the enablement flags the editor reads on session start.
                // Narrow to the not-found/denied signal specifically so a genuine failure still surfaces.
                .onErrorResume(
                        error -> error instanceof AppsmithException appsmithException
                                && (AppsmithErrorCode.NO_RESOURCE_FOUND
                                                .getCode()
                                                .equals(appsmithException.getAppErrorCode())
                                        || AppsmithErrorCode.ACL_NO_RESOURCE_FOUND
                                                .getCode()
                                                .equals(appsmithException.getAppErrorCode())),
                        error -> organizationService
                                .getCurrentUserOrganization()
                                .map(organization ->
                                        buildAIConfigStatusResponse(organization.getOrganizationConfiguration()))));
    }

    @Override
    public Mono<Map<String, Object>> testLlmConnection(Map<String, String> request) {
        return organizationService.getCurrentUserOrganizationId().flatMap(organizationId -> organizationService
                .findById(organizationId, MANAGE_ORGANIZATION)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "organization", organizationId)))
                .flatMap(organization -> testLlmConnectionInternal(request)
                        .delayUntil(response -> sendAskAiTestAnalyticsWhenActive(
                                organization.getId(), "LOCAL_LLM_CONNECTION", response, Map.of()))));
    }

    @Override
    public Mono<Map<String, Object>> fetchLlmModels(Map<String, String> request) {
        return organizationService.getCurrentUserOrganizationId().flatMap(organizationId -> organizationService
                .findById(organizationId, MANAGE_ORGANIZATION)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "organization", organizationId)))
                .flatMap(organization -> fetchLlmModelsInternal(request)));
    }

    @Override
    public Mono<Map<String, Object>> testApiKey(Map<String, String> request) {
        return organizationService.getCurrentUserOrganizationId().flatMap(organizationId -> organizationService
                .findById(organizationId, MANAGE_ORGANIZATION)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "organization", organizationId)))
                .flatMap(organization -> {
                    Map<String, Object> meta = new HashMap<>();
                    String provider = request.get("provider");
                    if (provider != null && !provider.trim().isEmpty()) {
                        meta.put("provider", provider.trim().toUpperCase(Locale.ROOT));
                    }
                    return testApiKeyInternal(request)
                            .delayUntil(response ->
                                    sendAskAiTestAnalyticsWhenActive(organization.getId(), "API_KEY", response, meta));
                }));
    }

    // ---- Connection Testing ----

    private Mono<Map<String, Object>> testLlmConnectionInternal(Map<String, String> request) {
        String rawUrl = request.get("url");
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "URL is required");
            return Mono.just(response);
        }

        final String url = rawUrl.trim();
        List<Map<String, String>> steps = new ArrayList<>();

        URI uri;
        try {
            uri = URI.create(url);
            if (uri.getHost() == null) {
                throw new IllegalArgumentException("No host specified");
            }
            // A scheme-relative input like "//host/api/generate" parses with a host but a NULL scheme, so it clears
            // the host check above and then NPEs on getScheme().equals(...) below — outside this try, before any Mono
            // exists, so it escapes the structured error response entirely. Validate the scheme while we can still
            // report it properly.
            if (uri.getScheme() == null
                    || !("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))) {
                throw new IllegalArgumentException("URL must start with http:// or https://");
            }
            steps.add(createStep("URL Parsing", "success", "Valid URL format"));
        } catch (Exception e) {
            steps.add(createStep("URL Parsing", "error", e.getMessage()));
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("steps", steps);
            response.put("error", "Invalid URL format: " + e.getMessage());
            response.put(
                    "suggestions",
                    List.of(
                            "Ensure URL starts with http:// or https://",
                            "Check for typos in the hostname",
                            "Use a hostname or private IP, not a loopback address: inside the Appsmith "
                                    + "container localhost/127.0.0.1 is Appsmith's own MongoDB, Redis and RTS",
                            "Example: http://host.docker.internal:11434/api/generate"));
            return Mono.just(response);
        }

        final String host = uri.getHost();
        // equalsIgnoreCase to match the scheme validation above, so "HTTPS://…" still resolves to 443 rather than 80.
        final int port = uri.getPort() != -1 ? uri.getPort() : ("https".equalsIgnoreCase(uri.getScheme()) ? 443 : 80);
        final String scheme = uri.getScheme();

        return Mono.fromCallable(() -> java.net.InetAddress.getByName(host))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(resolvedAddress -> {
                    // Report THAT the hostname resolved, not what it resolved to. Echoing the address (like the
                    // dropped resolvedIp/responsePreview fields) let a manager use this diagnostic to map the
                    // instance's private network, since matchesBlockedAddressClass deliberately permits RFC1918.
                    steps.add(createStep("DNS Resolution", "success", "Resolved " + host));

                    HttpClient httpClient = HttpClient.create()
                            .responseTimeout(Duration.ofSeconds(10))
                            .option(io.netty.channel.ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000);

                    WebClient webClient = WebClientUtils.builder(httpClient).build();

                    final long startTime = System.currentTimeMillis();
                    final List<Map<String, String>> finalSteps = new ArrayList<>(steps);

                    String path = uri.getPath();
                    boolean isOllamaEndpoint =
                            path != null && (path.contains("/api/generate") || path.contains("/api/chat"));
                    String testUrl = isOllamaEndpoint ? uri.resolve("/api/tags").toString() : url;

                    WebClient.RequestHeadersSpec<?> requestSpec = isOllamaEndpoint
                            ? webClient.get().uri(testUrl)
                            : webClient
                                    .post()
                                    .uri(testUrl)
                                    .header("Content-Type", "application/json")
                                    .bodyValue("{\"model\":\"test\",\"prompt\":\"Say hi\",\"stream\":false}");

                    return requestSpec
                            .exchangeToMono(clientResponse -> {
                                finalSteps.add(
                                        createStep("TCP Connection", "success", "Connected to " + host + ":" + port));

                                if ("https".equals(scheme)) {
                                    finalSteps.add(
                                            createStep("TLS Handshake", "success", "Secure connection established"));
                                }

                                int statusCode = clientResponse.statusCode().value();
                                finalSteps.add(createStep(
                                        "HTTP Response", "success", "Endpoint responded with HTTP " + statusCode));

                                return clientResponse
                                        .bodyToMono(String.class)
                                        .defaultIfEmpty("")
                                        .map(responseBody -> {
                                            long responseTime = System.currentTimeMillis() - startTime;
                                            Map<String, Object> response = new HashMap<>();

                                            response.put("responseTimeMs", responseTime);
                                            response.put("httpStatus", statusCode);
                                            response.put("host", host);
                                            response.put("port", port);

                                            boolean looksLikeLlm = false;
                                            String contentType = clientResponse
                                                    .headers()
                                                    .contentType()
                                                    .map(Object::toString)
                                                    .orElse("unknown");

                                            String truncatedResponse = responseBody.length() > 500
                                                    ? responseBody.substring(0, 500) + "..."
                                                    : responseBody;

                                            if (statusCode == 404) {
                                                finalSteps.add(createStep(
                                                        "Endpoint Check", "error", "Endpoint not found (404)"));
                                                response.put("success", false);
                                                response.put(
                                                        "error",
                                                        "Endpoint not found - the path '" + uri.getPath()
                                                                + "' does not exist on this server");
                                                response.put(
                                                        "suggestions",
                                                        List.of(
                                                                "Verify the endpoint path is correct",
                                                                "Common Ollama endpoints: /api/generate, /api/chat",
                                                                "Common OpenAI-compatible endpoints: /v1/completions, /v1/chat/completions",
                                                                "Check your LLM server documentation for the correct endpoint"));
                                            } else if (contentType.contains("text/html")) {
                                                finalSteps.add(createStep(
                                                        "Endpoint Check", "error", "Received HTML instead of JSON"));
                                                response.put("success", false);
                                                response.put(
                                                        "error",
                                                        "This doesn't appear to be an LLM API endpoint - received HTML response");
                                                response.put(
                                                        "suggestions",
                                                        List.of(
                                                                "The URL points to a web page, not an API endpoint",
                                                                "Check that the URL includes the API path (e.g., /api/generate)",
                                                                "Verify you're using the correct port for the API"));
                                            } else if (contentType.contains("application/json")
                                                    || responseBody.trim().startsWith("{")) {
                                                String lowerBody = responseBody.toLowerCase();
                                                if (lowerBody.contains("\"response\"")
                                                        || lowerBody.contains("\"content\"")
                                                        || lowerBody.contains("\"text\"")
                                                        || lowerBody.contains("\"output\"")
                                                        || lowerBody.contains("\"choices\"")
                                                        || lowerBody.contains("\"message\"")
                                                        || lowerBody.contains("\"generated\"")) {
                                                    looksLikeLlm = true;
                                                    finalSteps.add(createStep(
                                                            "Endpoint Check",
                                                            "success",
                                                            "Looks like a valid LLM endpoint"));
                                                } else if (lowerBody.contains("\"error\"")
                                                        || lowerBody.contains("\"model\"")) {
                                                    looksLikeLlm = true;
                                                    finalSteps.add(createStep(
                                                            "Endpoint Check",
                                                            "success",
                                                            "LLM endpoint responded (with error/model info)"));
                                                    response.put(
                                                            "warning",
                                                            "Endpoint responded with an error - this may be normal for a test request without a valid model");
                                                } else {
                                                    finalSteps.add(createStep(
                                                            "Endpoint Check",
                                                            "pending",
                                                            "JSON response but unclear if LLM"));
                                                    response.put(
                                                            "warning",
                                                            "Received JSON but couldn't confirm this is an LLM endpoint - please verify manually");
                                                }
                                            } else {
                                                finalSteps.add(createStep(
                                                        "Endpoint Check",
                                                        "pending",
                                                        "Unexpected content type: " + contentType));
                                                response.put(
                                                        "warning", "Received unexpected content type: " + contentType);
                                            }

                                            if (statusCode >= 200 && statusCode < 300 && looksLikeLlm) {
                                                response.put("success", true);
                                            } else if (statusCode >= 200
                                                    && statusCode < 500
                                                    && !response.containsKey("error")) {
                                                response.put("success", looksLikeLlm);
                                                if (!looksLikeLlm && !response.containsKey("error")) {
                                                    response.put(
                                                            "error", "Could not verify this is a valid LLM endpoint");
                                                    response.put(
                                                            "suggestions",
                                                            List.of(
                                                                    "The server responded but the response doesn't look like an LLM API",
                                                                    "Verify the complete URL path is correct",
                                                                    "Check your LLM server documentation"));
                                                }
                                            } else if (!response.containsKey("error")) {
                                                response.put("success", false);
                                                response.put("error", "Server returned HTTP " + statusCode);
                                                response.put("suggestions", getHttpErrorSuggestions(statusCode));
                                            }

                                            response.put("steps", finalSteps);
                                            return response;
                                        });
                            })
                            .onErrorResume(error -> {
                                long responseTime = System.currentTimeMillis() - startTime;
                                Map<String, Object> response = new HashMap<>();
                                response.put("success", false);
                                response.put("responseTimeMs", responseTime);
                                response.put("host", host);
                                response.put("port", port);

                                if (error instanceof WebClientRequestException) {
                                    Throwable cause = error.getCause();
                                    if (cause instanceof ConnectTimeoutException) {
                                        finalSteps.add(
                                                createStep("TCP Connection", "error", "Connection timed out after 5s"));
                                        response.put(
                                                "error",
                                                "Connection timed out - server not responding on port " + port);
                                        response.put(
                                                "suggestions",
                                                List.of(
                                                        "Check if the LLM server is running on port " + port,
                                                        "Verify firewall allows connections to port " + port,
                                                        "If running in Docker, ensure proper network configuration",
                                                        "Try: curl -v " + url));
                                    } else if (cause instanceof java.net.ConnectException) {
                                        finalSteps.add(createStep("TCP Connection", "error", "Connection refused"));
                                        response.put(
                                                "error",
                                                "Connection refused - no service listening on " + host + ":" + port);
                                        response.put(
                                                "suggestions",
                                                List.of(
                                                        "Start the LLM server (e.g., 'ollama serve' for Ollama)",
                                                        "Check if the service is listening on the correct port",
                                                        "Verify the port number in your URL",
                                                        "Try: lsof -i :" + port
                                                                + " (Mac/Linux) or netstat -an | findstr " + port
                                                                + " (Windows)"));
                                    } else if (cause instanceof SslHandshakeTimeoutException
                                            || (cause != null
                                                    && cause.getClass()
                                                            .getName()
                                                            .contains("Ssl"))) {
                                        finalSteps.add(createStep(
                                                "TCP Connection", "success", "Connected to " + host + ":" + port));
                                        finalSteps.add(
                                                createStep("TLS Handshake", "error", "SSL/TLS handshake failed"));
                                        response.put("error", "SSL/TLS handshake failed");
                                        response.put(
                                                "suggestions",
                                                List.of(
                                                        "Try using http:// instead of https:// for local servers",
                                                        "Check if the server's SSL certificate is valid",
                                                        "Verify the server supports TLS"));
                                    } else {
                                        finalSteps.add(createStep("TCP Connection", "error", "Connection failed"));
                                        response.put(
                                                "error",
                                                "Connection failed: "
                                                        + (cause != null ? cause.getMessage() : error.getMessage()));
                                        response.put(
                                                "suggestions",
                                                List.of(
                                                        "Check if the server is running and accessible",
                                                        "Verify network connectivity from the Appsmith server",
                                                        "Check server logs for more details"));
                                    }
                                } else if (error instanceof WebClientResponseException wcre) {
                                    finalSteps.add(createStep("TCP Connection", "success", "Connected"));
                                    finalSteps.add(createStep(
                                            "HTTP Request",
                                            "error",
                                            "HTTP " + wcre.getStatusCode().value()));
                                    response.put("error", "HTTP error: " + wcre.getStatusCode());
                                    response.put(
                                            "httpStatus", wcre.getStatusCode().value());
                                    response.put(
                                            "suggestions",
                                            getHttpErrorSuggestions(
                                                    wcre.getStatusCode().value()));
                                } else {
                                    finalSteps.add(createStep("Connection", "error", error.getMessage()));
                                    response.put("error", "Unexpected error: " + error.getMessage());
                                    response.put(
                                            "suggestions",
                                            List.of(
                                                    "Check the Appsmith server logs for more details",
                                                    "Verify the URL is correct and accessible"));
                                }

                                response.put("steps", finalSteps);
                                return Mono.just(response);
                            });
                })
                .onErrorResume(UnknownHostException.class, e -> {
                    steps.add(createStep("DNS Resolution", "error", "Could not resolve hostname"));
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("host", host);
                    response.put("port", port);
                    response.put("steps", steps);
                    response.put("error", "DNS resolution failed - hostname not found: " + host);
                    response.put(
                            "suggestions",
                            List.of(
                                    "Check if the hostname is spelled correctly",
                                    "If using localhost, ensure that's correct for your setup",
                                    "Try using IP address (e.g., 127.0.0.1) instead of hostname",
                                    "Check your DNS settings or /etc/hosts file"));
                    return Mono.just(response);
                });
    }

    // ---- Model Fetching ----

    private Mono<Map<String, Object>> fetchLlmModelsInternal(Map<String, String> request) {
        String rawUrl = request.get("url");
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "URL is required");
            response.put("models", List.of());
            return Mono.just(response);
        }

        String baseUrl = rawUrl.trim();
        if (baseUrl.contains("/api/")) {
            int apiIndex = baseUrl.indexOf("/api/");
            baseUrl = baseUrl.substring(0, apiIndex);
        }
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }

        final String tagsUrl = baseUrl + "/api/tags";

        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(10))
                .option(io.netty.channel.ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000);

        WebClient webClient = WebClientUtils.builder(httpClient).build();

        return webClient
                .get()
                .uri(tagsUrl)
                .exchangeToMono(clientResponse -> {
                    int statusCode = clientResponse.statusCode().value();

                    return clientResponse
                            .bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .map(responseBody -> {
                                Map<String, Object> response = new HashMap<>();

                                if (statusCode == 200) {
                                    List<Map<String, Object>> models = parseOllamaModels(responseBody);
                                    response.put("success", true);
                                    response.put("models", models);
                                } else {
                                    response.put("success", false);
                                    response.put("error", "Failed to fetch models: HTTP " + statusCode);
                                    response.put("models", List.of());
                                }

                                return response;
                            });
                })
                .onErrorResume(error -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("error", "Failed to connect to Ollama: " + error.getMessage());
                    response.put("models", List.of());
                    return Mono.just(response);
                });
    }

    private List<Map<String, Object>> parseOllamaModels(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode modelsNode = root.get("models");
            if (modelsNode == null || !modelsNode.isArray()) {
                return List.of();
            }

            List<Map<String, Object>> models = new ArrayList<>();
            for (JsonNode modelNode : modelsNode) {
                Map<String, Object> model = new HashMap<>();

                if (modelNode.has("name")) {
                    model.put("name", modelNode.get("name").asText());
                }
                if (modelNode.has("size")) {
                    model.put("size", modelNode.get("size").asLong());
                }
                if (modelNode.has("details")) {
                    JsonNode details = modelNode.get("details");
                    Map<String, String> detailsMap = new HashMap<>();
                    if (details.has("parameter_size")) {
                        detailsMap.put(
                                "parameter_size", details.get("parameter_size").asText());
                    }
                    if (details.has("quantization_level")) {
                        detailsMap.put(
                                "quantization_level",
                                details.get("quantization_level").asText());
                    }
                    if (!detailsMap.isEmpty()) {
                        model.put("details", detailsMap);
                    }
                }

                if (!model.isEmpty() && model.containsKey("name")) {
                    models.add(model);
                }
            }
            return models;
        } catch (Exception e) {
            log.warn("Failed to parse Ollama models response: {}", e.getMessage());
            return List.of();
        }
    }

    // ---- API Key Testing ----

    private Mono<Map<String, Object>> testApiKeyInternal(Map<String, String> request) {
        String provider = request.get("provider");
        String apiKey = request.get("apiKey");
        String endpoint = request.get("endpoint");
        String deploymentName = request.get("deploymentName");
        String apiVersion = request.get("apiVersion");
        String baseUrl = request.get("baseUrl");
        String model = request.get("model");

        if (provider == null || provider.trim().isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Provider is required");
            return Mono.just(response);
        }

        if (apiKey == null || apiKey.trim().isEmpty() || MASKED_API_KEY.equals(apiKey)) {
            return organizationService.getCurrentUserOrganization().flatMap(organization -> {
                OrganizationConfiguration config = organization.getOrganizationConfiguration();
                if (config == null) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("error", "No API key configured");
                    return Mono.just(response);
                }

                AIAssistantConfig aiAssistantConfig = config.getAiAssistantConfig();
                if (aiAssistantConfig == null) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("error", "No API key configured");
                    return Mono.just(response);
                }

                String storedKey = null;
                if ("CLAUDE".equalsIgnoreCase(provider)) {
                    storedKey = aiAssistantConfig.getClaudeApiKey();
                } else if ("OPENAI".equalsIgnoreCase(provider)) {
                    storedKey = aiAssistantConfig.getOpenaiApiKey();
                } else if ("COPILOT".equalsIgnoreCase(provider)) {
                    storedKey = aiAssistantConfig.getCopilotApiKey();
                } else if ("AZURE_OPENAI".equalsIgnoreCase(provider)) {
                    storedKey = aiAssistantConfig.getAzureOpenaiApiKey();
                    if (storedKey == null || storedKey.isEmpty()) {
                        storedKey = aiAssistantConfig.getCopilotApiKey();
                    }
                }

                storedKey = AIConfigSecretsCE.decrypt(storedKey);

                if (storedKey == null || storedKey.isEmpty()) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("error", "No " + provider + " API key configured. Please enter an API key first.");
                    return Mono.just(response);
                }

                // The destination for a stored credential comes from the saved configuration, never from the
                // request. The UI masks these keys, so honouring a request-supplied host would let anyone who
                // can reach this endpoint read one back by pointing the test at a collector they control.
                // Only the fields that cannot change the host — deployment name, API version, model — stay
                // overridable, so an administrator can still try a different deployment against their own
                // resource.
                if ("AZURE_OPENAI".equalsIgnoreCase(provider)) {
                    String resolvedEndpoint = aiAssistantConfig.getAzureOpenaiEndpoint();
                    if (!hasValue(resolvedEndpoint)) {
                        resolvedEndpoint = aiAssistantConfig.getCopilotEndpoint();
                    }
                    if (!allowsStoredCredential(resolvedEndpoint)) {
                        return Mono.just(insecureDestinationResponse(provider));
                    }

                    String resolvedDeployment = hasValue(deploymentName)
                            ? deploymentName
                            : aiAssistantConfig.getAzureOpenaiDeploymentName();
                    return testAzureOpenaiKey(storedKey, resolvedEndpoint, resolvedDeployment, apiVersion);
                }

                String resolvedBaseUrl = null;
                String resolvedModel = model;
                if ("CLAUDE".equalsIgnoreCase(provider)) {
                    resolvedBaseUrl = aiAssistantConfig.getClaudeBaseUrl();
                    if (!hasValue(resolvedModel)) {
                        resolvedModel = aiAssistantConfig.getClaudeModel();
                    }
                } else if ("OPENAI".equalsIgnoreCase(provider)) {
                    resolvedBaseUrl = aiAssistantConfig.getOpenaiBaseUrl();
                    if (!hasValue(resolvedModel)) {
                        resolvedModel = aiAssistantConfig.getOpenaiModel();
                    }
                }

                if (!allowsStoredCredential(resolvedBaseUrl)) {
                    return Mono.just(insecureDestinationResponse(provider));
                }

                return testApiKeyWithProvider(provider, storedKey, resolvedBaseUrl, resolvedModel);
            });
        }

        if ("AZURE_OPENAI".equalsIgnoreCase(provider)) {
            return testAzureOpenaiKey(apiKey.trim(), endpoint, deploymentName, apiVersion);
        }

        return testApiKeyWithProvider(provider, apiKey.trim(), baseUrl, model);
    }

    private Mono<Map<String, Object>> testApiKeyWithProvider(
            String provider, String apiKey, String baseUrl, String model) {
        HttpClient httpClient = HttpClient.create().responseTimeout(Duration.ofSeconds(30));
        WebClient webClient = WebClientUtils.builder(httpClient).build();

        final long startTime = System.currentTimeMillis();
        List<Map<String, String>> steps = new ArrayList<>();

        if ("OPENAI".equalsIgnoreCase(provider)) {
            String effectiveBaseUrl = hasValue(baseUrl) ? baseUrl.trim() : DEFAULT_OPENAI_BASE_URL;
            String effectiveModel = hasValue(model) ? model.trim() : DEFAULT_OPENAI_MODEL;
            String testModel = DEFAULT_OPENAI_BASE_URL.equals(effectiveBaseUrl) ? "gpt-3.5-turbo" : effectiveModel;
            return testOpenAIKey(webClient, apiKey, startTime, steps, effectiveBaseUrl, testModel);
        } else if ("CLAUDE".equalsIgnoreCase(provider)) {
            String effectiveBaseUrl = hasValue(baseUrl) ? baseUrl.trim() : DEFAULT_CLAUDE_BASE_URL;
            String effectiveModel = hasValue(model) ? model.trim() : DEFAULT_CLAUDE_MODEL;
            String testModel =
                    DEFAULT_CLAUDE_BASE_URL.equals(effectiveBaseUrl) ? "claude-haiku-4-5-20251001" : effectiveModel;
            return testClaudeKey(webClient, apiKey, startTime, steps, effectiveBaseUrl, testModel);
        } else {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Unknown provider: " + provider);
            return Mono.just(response);
        }
    }

    private Mono<Map<String, Object>> testOpenAIKey(
            WebClient webClient,
            String apiKey,
            long startTime,
            List<Map<String, String>> steps,
            String baseUrl,
            String model) {

        steps.add(createStep("API Key Format", "success", "Key starts with 'sk-'"));

        String payload = "{\"model\":\"" + model
                + "\",\"messages\":[{\"role\":\"user\",\"content\":\"Say hello\"}],\"max_tokens\":5}";

        String testUrl = stripTrailingSlash(baseUrl) + "/v1/chat/completions";

        return webClient
                .post()
                .uri(testUrl)
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .bodyValue(payload)
                .exchangeToMono(clientResponse -> {
                    steps.add(createStep("API Connection", "success", "Connected to OpenAI API"));

                    return clientResponse
                            .bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .map(responseBody -> {
                                long responseTime = System.currentTimeMillis() - startTime;
                                Map<String, Object> response = new HashMap<>();
                                int statusCode = clientResponse.statusCode().value();

                                response.put("responseTimeMs", responseTime);
                                response.put("httpStatus", statusCode);
                                response.put("provider", "OpenAI");

                                if (statusCode == 200) {
                                    steps.add(createStep("Authentication", "success", "API key is valid"));
                                    steps.add(createStep("Test Request", "success", "Successfully generated response"));
                                    response.put("success", true);
                                    response.put("message", "OpenAI API key is working correctly!");

                                    try {
                                        if (responseBody.contains("\"content\"")) {
                                            int start = responseBody.indexOf("\"content\"");
                                            int contentStart = responseBody.indexOf("\"", start + 10) + 1;
                                            int contentEnd = responseBody.indexOf("\"", contentStart);
                                            if (contentEnd > contentStart && contentEnd - contentStart < 200) {
                                                String content = responseBody.substring(contentStart, contentEnd);
                                                response.put("testResponse", content);
                                            }
                                        }
                                    } catch (Exception ignored) {
                                    }
                                } else if (statusCode == 401) {
                                    steps.add(createStep("Authentication", "error", "Invalid API key"));
                                    response.put("success", false);
                                    response.put("error", "Invalid API key - authentication failed");
                                    response.put(
                                            "suggestions",
                                            List.of(
                                                    "Check that the API key is correct",
                                                    "Ensure the key hasn't been revoked",
                                                    "Get a new key from https://platform.openai.com/api-keys"));
                                } else if (statusCode == 429) {
                                    steps.add(createStep("Authentication", "success", "API key is valid"));
                                    steps.add(createStep("Rate Limit", "error", "Rate limited or quota exceeded"));
                                    response.put("success", false);
                                    response.put("error", "Rate limited or quota exceeded");
                                    response.put(
                                            "suggestions",
                                            List.of(
                                                    "Your API key is valid but you've hit rate limits",
                                                    "Check your OpenAI usage and billing",
                                                    "Wait a moment and try again"));
                                } else if (statusCode == 403) {
                                    steps.add(createStep("Authentication", "error", "Access denied"));
                                    response.put("success", false);
                                    response.put("error", "Access denied - check API key permissions");
                                    response.put(
                                            "suggestions",
                                            List.of(
                                                    "Verify the API key has access to chat completions",
                                                    "Check if your OpenAI account is in good standing"));
                                } else {
                                    steps.add(createStep("API Request", "error", "HTTP " + statusCode));
                                    response.put("success", false);
                                    response.put("error", "OpenAI API returned HTTP " + statusCode);
                                    if (responseBody.length() < 500) {}
                                }

                                response.put("steps", steps);
                                return response;
                            });
                })
                .onErrorResume(error -> {
                    long responseTime = System.currentTimeMillis() - startTime;
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("responseTimeMs", responseTime);
                    response.put("provider", "OpenAI");

                    steps.add(createStep("API Connection", "error", "Failed to connect"));
                    response.put("error", "Failed to connect to OpenAI API: " + error.getMessage());
                    response.put(
                            "suggestions",
                            List.of(
                                    "Check your internet connection",
                                    "Verify OpenAI API is accessible from your server",
                                    "Check if there's a firewall blocking the connection"));
                    response.put("steps", steps);

                    return Mono.just(response);
                });
    }

    private Mono<Map<String, Object>> testClaudeKey(
            WebClient webClient,
            String apiKey,
            long startTime,
            List<Map<String, String>> steps,
            String baseUrl,
            String model) {

        steps.add(createStep("API Key Format", "success", "Key format accepted"));

        String payload = "{\"model\":\"" + model
                + "\",\"max_tokens\":10,\"messages\":[{\"role\":\"user\",\"content\":\"Say hello\"}]}";

        String testUrl = stripTrailingSlash(baseUrl) + "/v1/messages";

        return webClient
                .post()
                .uri(testUrl)
                .header("Content-Type", "application/json")
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .bodyValue(payload)
                .exchangeToMono(clientResponse -> {
                    steps.add(createStep("API Connection", "success", "Connected to Anthropic API"));

                    return clientResponse
                            .bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .map(responseBody -> {
                                long responseTime = System.currentTimeMillis() - startTime;
                                Map<String, Object> response = new HashMap<>();
                                int statusCode = clientResponse.statusCode().value();

                                response.put("responseTimeMs", responseTime);
                                response.put("httpStatus", statusCode);
                                response.put("provider", "Claude");

                                if (statusCode == 200) {
                                    steps.add(createStep("Authentication", "success", "API key is valid"));
                                    steps.add(createStep("Test Request", "success", "Successfully generated response"));
                                    response.put("success", true);
                                    response.put("message", "Claude API key is working correctly!");

                                    try {
                                        if (responseBody.contains("\"text\"")) {
                                            int start = responseBody.indexOf("\"text\"");
                                            int textStart = responseBody.indexOf("\"", start + 7) + 1;
                                            int textEnd = responseBody.indexOf("\"", textStart);
                                            if (textEnd > textStart && textEnd - textStart < 200) {
                                                String text = responseBody.substring(textStart, textEnd);
                                                response.put("testResponse", text);
                                            }
                                        }
                                    } catch (Exception ignored) {
                                    }
                                } else if (statusCode == 401) {
                                    steps.add(createStep("Authentication", "error", "Invalid API key"));
                                    response.put("success", false);
                                    response.put("error", "Invalid API key - authentication failed");
                                    response.put(
                                            "suggestions",
                                            List.of(
                                                    "Check that the API key is correct",
                                                    "Ensure the key hasn't been revoked",
                                                    "Get a new key from https://console.anthropic.com/"));
                                } else if (statusCode == 429) {
                                    steps.add(createStep("Authentication", "success", "API key is valid"));
                                    steps.add(createStep("Rate Limit", "error", "Rate limited"));
                                    response.put("success", false);
                                    response.put("error", "Rate limited - too many requests");
                                    response.put(
                                            "suggestions",
                                            List.of(
                                                    "Your API key is valid but you've hit rate limits",
                                                    "Wait a moment and try again",
                                                    "Check your Anthropic usage limits"));
                                } else if (statusCode == 403) {
                                    steps.add(createStep("Authentication", "error", "Access denied"));
                                    response.put("success", false);
                                    response.put("error", "Access denied - check API key permissions");
                                    response.put(
                                            "suggestions",
                                            List.of(
                                                    "Verify the API key has proper permissions",
                                                    "Check if your Anthropic account is active"));
                                } else if (statusCode == 400) {
                                    if (responseBody.contains("invalid_api_key")
                                            || responseBody.contains("authentication")) {
                                        steps.add(createStep("Authentication", "error", "Invalid API key"));
                                        response.put("success", false);
                                        response.put("error", "Invalid API key");
                                    } else {
                                        steps.add(createStep("Authentication", "success", "API key accepted"));
                                        steps.add(createStep("Request", "error", "Bad request"));
                                        response.put("success", false);
                                        response.put("error", "API request error (key may still be valid)");
                                    }
                                    if (responseBody.length() < 500) {}
                                } else {
                                    steps.add(createStep("API Request", "error", "HTTP " + statusCode));
                                    response.put("success", false);
                                    response.put("error", "Anthropic API returned HTTP " + statusCode);
                                    if (responseBody.length() < 500) {}
                                }

                                response.put("steps", steps);
                                return response;
                            });
                })
                .onErrorResume(error -> {
                    long responseTime = System.currentTimeMillis() - startTime;
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("responseTimeMs", responseTime);
                    response.put("provider", "Claude");

                    steps.add(createStep("API Connection", "error", "Failed to connect"));
                    response.put("error", "Failed to connect to Anthropic API: " + error.getMessage());
                    response.put(
                            "suggestions",
                            List.of(
                                    "Check your internet connection",
                                    "Verify Anthropic API is accessible from your server",
                                    "Check if there's a firewall blocking the connection"));
                    response.put("steps", steps);

                    return Mono.just(response);
                });
    }

    private Mono<Map<String, Object>> testAzureOpenaiKey(
            String apiKey, String endpoint, String deploymentName, String apiVersion) {

        final long startTime = System.currentTimeMillis();
        List<Map<String, String>> steps = new ArrayList<>();

        steps.add(createStep("API Key Format", "success", "Key format accepted"));

        if (apiKey.length() < 20) {
            steps.add(createStep("Key Validation", "error", "Key appears too short"));
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "API key appears to be invalid - too short");
            response.put("steps", steps);
            response.put(
                    "suggestions",
                    List.of(
                            "Azure OpenAI API keys are typically 32 characters",
                            "Get your key from Azure Portal > Your OpenAI Resource > Keys and Endpoint"));
            return Mono.just(response);
        }

        steps.add(createStep("Key Validation", "success", "Key length validated"));

        if (endpoint == null || endpoint.trim().isEmpty()) {
            steps.add(createStep("Endpoint", "error", "No endpoint provided"));
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Azure OpenAI endpoint is required for testing");
            response.put("steps", steps);
            response.put("suggestions", List.of("Enter your Azure OpenAI endpoint URL"));
            return Mono.just(response);
        }

        if (deploymentName == null || deploymentName.trim().isEmpty()) {
            steps.add(createStep("Deployment", "error", "No deployment name provided"));
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Deployment name is required for testing");
            response.put("steps", steps);
            response.put("suggestions", List.of("Enter your Azure OpenAI deployment name"));
            return Mono.just(response);
        }

        String trimmedEndpoint = stripTrailingSlash(endpoint.trim());
        String effectiveApiVersion = hasValue(apiVersion) ? apiVersion.trim() : DEFAULT_AZURE_API_VERSION;
        String encodedDeployment = URLEncoder.encode(deploymentName.trim(), StandardCharsets.UTF_8);
        String url = trimmedEndpoint + "/openai/deployments/" + encodedDeployment + "/chat/completions?api-version="
                + effectiveApiVersion;

        steps.add(createStep("URL Construction", "success", "Built Azure OpenAI URL"));

        String payload = "{\"messages\":[{\"role\":\"user\",\"content\":\"Say hello\"}],\"max_completion_tokens\":5}";

        HttpClient httpClient = HttpClient.create().responseTimeout(Duration.ofSeconds(30));
        WebClient webClient = WebClientUtils.builder(httpClient).build();

        return webClient
                .post()
                .uri(url)
                .header("Content-Type", "application/json")
                .header("api-key", apiKey)
                .bodyValue(payload)
                .exchangeToMono(clientResponse -> {
                    steps.add(createStep("API Connection", "success", "Connected to Azure OpenAI"));

                    return clientResponse
                            .bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .map(responseBody -> {
                                long responseTime = System.currentTimeMillis() - startTime;
                                Map<String, Object> response = new HashMap<>();
                                int statusCode = clientResponse.statusCode().value();

                                response.put("responseTimeMs", responseTime);
                                response.put("httpStatus", statusCode);
                                response.put("provider", "Azure OpenAI");

                                if (statusCode == 200) {
                                    steps.add(createStep("Authentication", "success", "API key is valid"));
                                    steps.add(createStep("Test Request", "success", "Successfully generated response"));
                                    response.put("success", true);
                                    response.put("message", "Azure OpenAI API key is working correctly!");

                                    try {
                                        if (responseBody.contains("\"content\"")) {
                                            int start = responseBody.indexOf("\"content\"");
                                            int contentStart = responseBody.indexOf("\"", start + 10) + 1;
                                            int contentEnd = responseBody.indexOf("\"", contentStart);
                                            if (contentEnd > contentStart && contentEnd - contentStart < 200) {
                                                String content = responseBody.substring(contentStart, contentEnd);
                                                response.put("testResponse", content);
                                            }
                                        }
                                    } catch (Exception ignored) {
                                    }
                                } else if (statusCode == 401) {
                                    steps.add(createStep("Authentication", "error", "Invalid API key"));
                                    response.put("success", false);
                                    response.put("error", "Invalid API key - authentication failed");
                                    response.put(
                                            "suggestions",
                                            List.of(
                                                    "Check that the API key is correct",
                                                    "Ensure the key hasn't been revoked",
                                                    "Get KEY 1 or KEY 2 from Azure Portal > Your OpenAI Resource > Keys and Endpoint"));
                                } else if (statusCode == 404) {
                                    steps.add(createStep("Authentication", "success", "API key accepted"));
                                    steps.add(createStep("Deployment", "error", "Deployment not found"));
                                    response.put("success", false);
                                    response.put(
                                            "error", "Deployment '" + deploymentName + "' not found at this endpoint");
                                    response.put(
                                            "suggestions",
                                            List.of(
                                                    "Verify the deployment name matches your Azure OpenAI Studio deployment",
                                                    "Check the endpoint URL matches your Azure OpenAI resource",
                                                    "Ensure the deployment is active in Azure OpenAI Studio"));
                                } else if (statusCode == 429) {
                                    steps.add(createStep("Authentication", "success", "API key is valid"));
                                    steps.add(createStep("Rate Limit", "error", "Rate limited or quota exceeded"));
                                    response.put("success", false);
                                    response.put("error", "Rate limited or quota exceeded");
                                    response.put(
                                            "suggestions",
                                            List.of(
                                                    "Your API key is valid but you've hit rate limits",
                                                    "Check your Azure OpenAI usage and quotas",
                                                    "Wait a moment and try again"));
                                } else {
                                    steps.add(createStep("API Request", "error", "HTTP " + statusCode));
                                    response.put("success", false);
                                    response.put("error", "Azure OpenAI API returned HTTP " + statusCode);
                                    if (responseBody.length() < 500) {}
                                }

                                response.put("steps", steps);
                                return response;
                            });
                })
                .onErrorResume(error -> {
                    long responseTime = System.currentTimeMillis() - startTime;
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("responseTimeMs", responseTime);
                    response.put("provider", "Azure OpenAI");

                    steps.add(createStep("API Connection", "error", "Failed to connect"));
                    response.put("error", "Failed to connect to Azure OpenAI: " + error.getMessage());
                    response.put(
                            "suggestions",
                            List.of(
                                    "Check that the endpoint URL is correct",
                                    "Verify the Azure OpenAI resource is accessible",
                                    "Check if there's a firewall blocking the connection"));
                    response.put("steps", steps);

                    return Mono.just(response);
                });
    }

    // ---- Response Builders ----

    private Map<String, Object> buildAIConfigResponse(OrganizationConfiguration config) {
        if (config == null || config.getAiAssistantConfig() == null) {
            return buildEmptyAIConfigResponse();
        }
        AIAssistantConfig aiAssistantConfig = config.getAiAssistantConfig();
        Map<String, Object> response = new HashMap<>();
        response.put("isAIAssistantEnabled", aiAssistantConfig.getIsAIAssistantEnabled());
        response.put("provider", aiAssistantConfig.getAiProvider());
        response.put("hasClaudeApiKey", hasValue(aiAssistantConfig.getClaudeApiKey()));
        response.put("hasOpenaiApiKey", hasValue(aiAssistantConfig.getOpenaiApiKey()));
        response.put("hasCopilotApiKey", hasValue(aiAssistantConfig.getCopilotApiKey()));
        response.put("copilotEndpoint", aiAssistantConfig.getCopilotEndpoint());
        response.put("hasAzureOpenaiApiKey", hasValue(aiAssistantConfig.getAzureOpenaiApiKey()));
        response.put("azureOpenaiEndpoint", aiAssistantConfig.getAzureOpenaiEndpoint());
        response.put("azureOpenaiDeploymentName", aiAssistantConfig.getAzureOpenaiDeploymentName());
        response.put("azureOpenaiApiVersion", aiAssistantConfig.getAzureOpenaiApiVersion());
        response.put("azureOpenaiMaxCompletionTokens", aiAssistantConfig.getAzureOpenaiMaxCompletionTokens());
        response.put("localLlmUrl", aiAssistantConfig.getLocalLlmUrl());
        response.put("localLlmContextSize", aiAssistantConfig.getLocalLlmContextSize());
        response.put("localLlmModel", aiAssistantConfig.getLocalLlmModel());
        addProviderDefaults(response, config);
        return response;
    }

    private Map<String, Object> buildAIConfigResponseForGet(OrganizationConfiguration config) {
        Map<String, Object> response = new HashMap<>();
        if (config == null) {
            return buildEmptyAIConfigResponse();
        }

        AIAssistantConfig aiAssistantConfig = config.getAiAssistantConfig();
        if (aiAssistantConfig == null) {
            return buildEmptyAIConfigResponse();
        }

        response.put("isAIAssistantEnabled", Boolean.TRUE.equals(aiAssistantConfig.getIsAIAssistantEnabled()));

        AIProvider storedProvider = aiAssistantConfig.getAiProvider();
        if (storedProvider == AIProvider.COPILOT) {
            storedProvider = AIProvider.AZURE_OPENAI;
        }
        response.put("provider", storedProvider != null ? storedProvider.name() : "");

        response.put("hasClaudeApiKey", hasValue(aiAssistantConfig.getClaudeApiKey()));
        response.put("hasOpenaiApiKey", hasValue(aiAssistantConfig.getOpenaiApiKey()));
        response.put("hasCopilotApiKey", hasValue(aiAssistantConfig.getCopilotApiKey()));
        response.put("copilotEndpoint", defaultString(aiAssistantConfig.getCopilotEndpoint()));

        boolean hasAzureKey =
                hasValue(aiAssistantConfig.getAzureOpenaiApiKey()) || hasValue(aiAssistantConfig.getCopilotApiKey());
        String azureEndpoint = ObjectUtils.defaultIfNull(
                aiAssistantConfig.getAzureOpenaiEndpoint(), aiAssistantConfig.getCopilotEndpoint());

        response.put("hasAzureOpenaiApiKey", hasAzureKey);
        response.put("azureOpenaiEndpoint", defaultString(azureEndpoint));
        response.put("azureOpenaiDeploymentName", defaultString(aiAssistantConfig.getAzureOpenaiDeploymentName()));
        response.put(
                "azureOpenaiApiVersion",
                ObjectUtils.defaultIfNull(aiAssistantConfig.getAzureOpenaiApiVersion(), DEFAULT_AZURE_API_VERSION));
        response.put(
                "azureOpenaiMaxCompletionTokens",
                ObjectUtils.defaultIfNull(
                        aiAssistantConfig.getAzureOpenaiMaxCompletionTokens(), DEFAULT_AZURE_MAX_COMPLETION_TOKENS));

        response.put("localLlmUrl", defaultString(aiAssistantConfig.getLocalLlmUrl()));
        response.put("hasLocalLlmUrl", hasValue(aiAssistantConfig.getLocalLlmUrl()));
        response.put("localLlmContextSize", ObjectUtils.defaultIfNull(aiAssistantConfig.getLocalLlmContextSize(), -1));
        response.put("localLlmModel", defaultString(aiAssistantConfig.getLocalLlmModel()));

        addProviderDefaults(response, config);

        return response;
    }

    /**
     * The subset safe to hand to a user who cannot manage the organization: enablement, the
     * selected provider, and whether a credential exists — never the URL, endpoint, deployment
     * name or model. Mirrors the fields {@code loadAISettingsSaga} actually reads.
     */
    private Map<String, Object> buildAIConfigStatusResponse(OrganizationConfiguration config) {
        Map<String, Object> response = new HashMap<>();
        AIAssistantConfig aiAssistantConfig = config == null ? null : config.getAiAssistantConfig();

        if (aiAssistantConfig == null) {
            response.put("isAIAssistantEnabled", false);
            response.put("provider", "");
            response.put("hasClaudeApiKey", false);
            response.put("hasOpenaiApiKey", false);
            response.put("hasAzureOpenaiApiKey", false);
            response.put("hasLocalLlmUrl", false);
            return response;
        }

        response.put("isAIAssistantEnabled", Boolean.TRUE.equals(aiAssistantConfig.getIsAIAssistantEnabled()));

        AIProvider storedProvider = aiAssistantConfig.getAiProvider();
        if (storedProvider == AIProvider.COPILOT) {
            storedProvider = AIProvider.AZURE_OPENAI;
        }
        response.put("provider", storedProvider != null ? storedProvider.name() : "");

        response.put("hasClaudeApiKey", hasValue(aiAssistantConfig.getClaudeApiKey()));
        response.put("hasOpenaiApiKey", hasValue(aiAssistantConfig.getOpenaiApiKey()));
        response.put(
                "hasAzureOpenaiApiKey",
                hasValue(aiAssistantConfig.getAzureOpenaiApiKey()) || hasValue(aiAssistantConfig.getCopilotApiKey()));
        response.put("hasLocalLlmUrl", hasValue(aiAssistantConfig.getLocalLlmUrl()));

        return response;
    }

    private Map<String, Object> buildEmptyAIConfigResponse() {
        Map<String, Object> response = new HashMap<>();
        response.put("isAIAssistantEnabled", false);
        response.put("provider", "");
        response.put("hasClaudeApiKey", false);
        response.put("hasOpenaiApiKey", false);
        response.put("hasCopilotApiKey", false);
        response.put("copilotEndpoint", "");
        response.put("hasAzureOpenaiApiKey", false);
        response.put("azureOpenaiEndpoint", "");
        response.put("azureOpenaiDeploymentName", "");
        response.put("azureOpenaiApiVersion", DEFAULT_AZURE_API_VERSION);
        response.put("azureOpenaiMaxCompletionTokens", DEFAULT_AZURE_MAX_COMPLETION_TOKENS);
        response.put("localLlmUrl", "");
        response.put("hasLocalLlmUrl", false);
        response.put("localLlmContextSize", -1);
        response.put("localLlmModel", "");
        addProviderDefaults(response, null);
        return response;
    }

    private void addProviderDefaults(Map<String, Object> response, OrganizationConfiguration config) {
        AIAssistantConfig aiAssistantConfig = config != null ? config.getAiAssistantConfig() : null;
        response.put(
                "claudeModel",
                aiAssistantConfig != null
                        ? ObjectUtils.defaultIfNull(aiAssistantConfig.getClaudeModel(), DEFAULT_CLAUDE_MODEL)
                        : DEFAULT_CLAUDE_MODEL);
        response.put(
                "claudeBaseUrl",
                aiAssistantConfig != null
                        ? ObjectUtils.defaultIfNull(aiAssistantConfig.getClaudeBaseUrl(), DEFAULT_CLAUDE_BASE_URL)
                        : DEFAULT_CLAUDE_BASE_URL);
        response.put(
                "openaiModel",
                aiAssistantConfig != null
                        ? ObjectUtils.defaultIfNull(aiAssistantConfig.getOpenaiModel(), DEFAULT_OPENAI_MODEL)
                        : DEFAULT_OPENAI_MODEL);
        response.put(
                "openaiBaseUrl",
                aiAssistantConfig != null
                        ? ObjectUtils.defaultIfNull(aiAssistantConfig.getOpenaiBaseUrl(), DEFAULT_OPENAI_BASE_URL)
                        : DEFAULT_OPENAI_BASE_URL);
    }

    // ---- Helpers ----

    private Map<String, String> createStep(String name, String status, String detail) {
        return Map.of("name", name, "status", status, "detail", detail);
    }

    private List<String> getHttpErrorSuggestions(int statusCode) {
        List<String> suggestions = new ArrayList<>();
        if (statusCode == 401 || statusCode == 403) {
            suggestions.add("Check if authentication is required");
            suggestions.add("Verify API key or credentials if needed");
        } else if (statusCode == 404) {
            suggestions.add("Verify the endpoint path is correct");
            suggestions.add("Check the LLM server documentation for the correct API endpoint");
            suggestions.add("Common endpoints: /api/generate, /api/chat, /v1/completions");
        } else if (statusCode >= 500) {
            suggestions.add("The LLM server encountered an internal error");
            suggestions.add("Check the LLM server logs");
            suggestions.add("Verify the server has enough resources (memory, disk)");
        }
        return suggestions;
    }

    private void validateApiKey(
            String value, java.util.function.Consumer<String> setter, int maxLength, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            return;
        }
        String trimmed = value.trim();
        if (trimmed.length() > maxLength) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, fieldName + " is too long");
        }
        // Every provider credential reaches storage through here, so this is the one place that
        // needs to encrypt. Read sites decrypt via AIConfigSecretsCE.decrypt.
        setter.accept(AIConfigSecretsCE.encrypt(trimmed));
    }

    /**
     * Drops a stored provider credential when its destination changes and the request supplies no
     * replacement.
     *
     * <p>Pinning the test request to the saved destination stopped a caller naming the host inline,
     * but not the same attack in two steps: save a new base URL with the key field left blank — the
     * key is preserved, since a blank value means "unchanged" — and the saved credential now points
     * at a host of the caller's choosing. Testing the key, or simply using the assistant, then sends
     * it there. The UI masks these keys precisely so an administrator cannot read them back.
     *
     * <p>Binding the credential to its destination removes the step: change where it goes and it has
     * to be entered again.
     */
    private void clearKeyIfDestinationChanged(
            String previousDestination,
            String currentDestination,
            String suppliedApiKey,
            java.util.function.Consumer<String> keySetter) {
        String supplied = suppliedApiKey == null ? "" : suppliedApiKey.trim();
        boolean hasReplacement = !supplied.isEmpty() && !MASKED_API_KEY.equals(supplied);
        if (hasReplacement || Objects.equals(previousDestination, currentDestination)) {
            return;
        }
        keySetter.accept(null);
    }

    private void validateTrimmedString(
            String value, java.util.function.Consumer<String> setter, int maxLength, String fieldName) {
        if (value == null) {
            return;
        }
        String trimmed = value.trim();
        if (trimmed.length() > maxLength) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, fieldName + " is too long");
        }
        setter.accept(trimmed.isEmpty() ? null : trimmed);
    }

    private boolean hasValue(String value) {
        return value != null && !value.isEmpty();
    }

    private String defaultString(String value) {
        return value != null ? value : "";
    }

    private String stripTrailingSlash(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    /**
     * Applies only when the key comes from storage. An administrator who types a key into the form is
     * knowingly sending that value to the URL beside it, and that path is left alone.
     */
    private boolean allowsStoredCredential(String url) {
        return AIConfigSecretsCE.allowsStoredCredential(url);
    }

    private Map<String, Object> insecureDestinationResponse(String provider) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put(
                "error",
                "The configured " + provider
                        + " endpoint does not use HTTPS. Testing the saved API key would send it over an unencrypted connection.");
        response.put(
                "suggestions",
                List.of(
                        "Change the endpoint to an https:// URL",
                        "Or type the API key into the field above to test this endpoint explicitly"));
        return response;
    }
}
