package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.domains.AIAssistantConfig;
import com.appsmith.server.domains.AIProvider;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.AIEditorContextDTO;
import com.appsmith.server.dtos.AIMessageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.AiDatasourceSchemaSerializerCE;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.AIReferenceService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.DatasourceStructureSolution;
import com.appsmith.util.WebClientUtils;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.net.InetAddress;
import java.net.URI;
import java.net.URLEncoder;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.constants.AIConstants.DEFAULT_AZURE_API_VERSION;
import static com.appsmith.server.constants.AIConstants.DEFAULT_AZURE_MAX_COMPLETION_TOKENS;
import static com.appsmith.server.constants.AIConstants.DEFAULT_CLAUDE_BASE_URL;
import static com.appsmith.server.constants.AIConstants.DEFAULT_CLAUDE_MODEL;
import static com.appsmith.server.constants.AIConstants.DEFAULT_OPENAI_BASE_URL;
import static com.appsmith.server.constants.AIConstants.DEFAULT_OPENAI_MODEL;

@Slf4j
@RequiredArgsConstructor
public class AIAssistantServiceCEImpl implements AIAssistantServiceCE {

    /** Match client-side serialize budget; final DTO field is capped at {@link #AI_SCHEMA_CONTEXT_MAX}. */
    private static final int AI_SCHEMA_CHAR_BUDGET = 10000;

    private static final int AI_SCHEMA_CONTEXT_MAX = 15000;

    private final OrganizationService organizationService;
    private final AIReferenceService aiReferenceService;
    private final NewActionService newActionService;
    private final DatasourceStructureSolution datasourceStructureSolution;
    private final PluginService pluginService;
    private final ActionPermission actionPermission;

    private static final WebClient claudeWebClient = WebClientUtils.builder(
                    HttpClient.create().responseTimeout(Duration.ofSeconds(60)))
            .baseUrl(DEFAULT_CLAUDE_BASE_URL)
            .build();

    private static final WebClient openaiWebClient = WebClientUtils.builder(
                    HttpClient.create().responseTimeout(Duration.ofSeconds(60)))
            .baseUrl(DEFAULT_OPENAI_BASE_URL)
            .build();

    private static WebClient getOrBuildWebClient(String baseUrl, String defaultBaseUrl, WebClient cachedClient) {
        if (baseUrl == null || baseUrl.isEmpty() || defaultBaseUrl.equals(baseUrl)) {
            return cachedClient;
        }
        return WebClientUtils.builder(HttpClient.create().responseTimeout(Duration.ofSeconds(60)))
                .baseUrl(baseUrl)
                .build();
    }

    private static String resolveConfig(String configValue, String defaultValue) {
        return (configValue != null && !configValue.isEmpty()) ? configValue : defaultValue;
    }

    @Override
    public Mono<String> getAIResponse(String provider, String prompt, AIEditorContextDTO context) {
        return getAIResponse(provider, prompt, context, null);
    }

    @Override
    public Mono<String> getAIResponse(
            String provider, String prompt, AIEditorContextDTO context, List<AIMessageDTO> conversationHistory) {
        if (provider == null || provider.trim().isEmpty() || provider.length() > 50) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Invalid provider"));
        }

        AIProvider providerEnum;
        try {
            providerEnum = AIProvider.valueOf(provider.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Invalid provider"));
        }

        return organizationService.getCurrentUserOrganization().flatMap(organization -> {
            if (organization == null || organization.getOrganizationConfiguration() == null) {
                return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "Organization not found"));
            }

            AIAssistantConfig aiConfig =
                    organization.getOrganizationConfiguration().getAiAssistantConfig();
            if (aiConfig == null || !Boolean.TRUE.equals(aiConfig.getIsAIAssistantEnabled())) {
                return Mono.error(new AppsmithException(
                        AppsmithError.INVALID_PARAMETER,
                        "AI Assistant is disabled. Please contact your administrator."));
            }

            return enrichContextWithDatasourceSchema(prompt, context)
                    .flatMap(ctx -> dispatchToProvider(providerEnum, aiConfig, prompt, ctx, conversationHistory));
        });
    }

    @Override
    public String getAIErrorMessage(Throwable error) {
        if (!(error instanceof AppsmithException appsmithError)) {
            log.error("Non-Appsmith AI error: {}", error.getMessage(), error);
            return "Failed to get AI response. Please try again or check your AI configuration.";
        }
        if (appsmithError.getError() == AppsmithError.INVALID_CREDENTIALS) {
            return "Invalid API key. Please check your API key in settings.";
        }
        if (appsmithError.getMessage() != null && appsmithError.getMessage().contains("Rate limit")) {
            return "Rate limit exceeded. Please try again later.";
        }
        return appsmithError.getMessage() != null
                ? appsmithError.getMessage()
                : appsmithError.getError().getMessage();
    }

    private Mono<String> dispatchToProvider(
            AIProvider provider,
            AIAssistantConfig aiConfig,
            String prompt,
            AIEditorContextDTO ctx,
            List<AIMessageDTO> conversationHistory) {
        return switch (provider) {
            case LOCAL_LLM -> resolveAndCallLocalLLM(aiConfig, prompt, ctx, conversationHistory);
            case AZURE_OPENAI, COPILOT -> resolveAndCallAzureOpenAI(aiConfig, prompt, ctx, conversationHistory);
            case CLAUDE -> resolveAndCallClaude(aiConfig, prompt, ctx, conversationHistory);
            case OPENAI -> resolveAndCallOpenAI(aiConfig, prompt, ctx, conversationHistory);
        };
    }

    private Mono<String> resolveAndCallLocalLLM(
            AIAssistantConfig aiConfig, String prompt, AIEditorContextDTO ctx, List<AIMessageDTO> conversationHistory) {
        String url = aiConfig.getLocalLlmUrl();
        String model = aiConfig.getLocalLlmModel();
        if (url == null || url.trim().isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "Local LLM URL not configured"));
        }
        if (model == null || model.trim().isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "Local LLM model not configured"));
        }
        return callLocalLLMAPI(url.trim(), model.trim(), prompt, ctx, conversationHistory);
    }

    private Mono<String> resolveAndCallAzureOpenAI(
            AIAssistantConfig aiConfig, String prompt, AIEditorContextDTO ctx, List<AIMessageDTO> conversationHistory) {
        String apiKey = aiConfig.getAzureOpenaiApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            apiKey = aiConfig.getCopilotApiKey();
        }
        String endpoint = aiConfig.getAzureOpenaiEndpoint();
        if (endpoint == null || endpoint.trim().isEmpty()) {
            endpoint = aiConfig.getCopilotEndpoint();
        }
        String deploymentName = aiConfig.getAzureOpenaiDeploymentName();

        if (apiKey == null || apiKey.trim().isEmpty()) {
            return Mono.error(
                    new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "Azure OpenAI API key not configured"));
        }
        if (endpoint == null || endpoint.trim().isEmpty()) {
            return Mono.error(
                    new AppsmithException(
                            AppsmithError.NO_RESOURCE_FOUND,
                            "Azure OpenAI endpoint not configured. Add your Azure OpenAI resource endpoint (e.g. https://YOUR_RESOURCE.openai.azure.com/)"));
        }
        if (deploymentName == null || deploymentName.trim().isEmpty()) {
            return Mono.error(
                    new AppsmithException(
                            AppsmithError.NO_RESOURCE_FOUND,
                            "Azure OpenAI deployment name not configured. Add the name of your model deployment from Azure OpenAI Studio."));
        }
        return callAzureOpenAIAPI(
                endpoint.trim(),
                deploymentName.trim(),
                apiKey,
                prompt,
                ctx,
                conversationHistory,
                aiConfig.getAzureOpenaiApiVersion(),
                aiConfig.getAzureOpenaiMaxCompletionTokens());
    }

    private Mono<String> resolveAndCallClaude(
            AIAssistantConfig aiConfig, String prompt, AIEditorContextDTO ctx, List<AIMessageDTO> conversationHistory) {
        String apiKey = aiConfig.getClaudeApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return Mono.error(
                    new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "API key not configured for this provider"));
        }
        return callClaudeAPI(
                apiKey, prompt, ctx, conversationHistory, aiConfig.getClaudeModel(), aiConfig.getClaudeBaseUrl());
    }

    private Mono<String> resolveAndCallOpenAI(
            AIAssistantConfig aiConfig, String prompt, AIEditorContextDTO ctx, List<AIMessageDTO> conversationHistory) {
        String apiKey = aiConfig.getOpenaiApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return Mono.error(
                    new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "API key not configured for this provider"));
        }
        return callOpenAIAPI(
                apiKey, prompt, ctx, conversationHistory, aiConfig.getOpenaiModel(), aiConfig.getOpenaiBaseUrl());
    }

    /**
     * When {@code context.entityId} is set, clears client-supplied schema fields and repopulates
     * from the action's datasource structure (SQL: prompt-first table selection; other DB plugins:
     * legacy draft-query heuristics).
     */
    private Mono<AIEditorContextDTO> enrichContextWithDatasourceSchema(String prompt, AIEditorContextDTO context) {
        if (context == null || !StringUtils.hasText(context.getEntityId())) {
            return Mono.just(context);
        }

        context.setDatabaseSchema(null);
        context.setDatasourceType(null);

        String safePrompt = prompt == null ? "" : prompt;
        String safeCurrentValue = context.getCurrentValue() == null ? "" : context.getCurrentValue();

        return newActionService
                .findActionDTObyIdAndViewMode(
                        context.getEntityId().trim(), false, actionPermission.getExecutePermission())
                .flatMap(action -> {
                    if (action.getPluginType() != PluginType.DB) {
                        return Mono.just(context);
                    }
                    Datasource ds = action.getDatasource();
                    if (ds == null || !StringUtils.hasText(ds.getId())) {
                        return Mono.just(context);
                    }
                    String pluginId = action.getPluginId();
                    if (!StringUtils.hasText(pluginId)) {
                        return Mono.just(context);
                    }
                    return pluginService
                            .findById(pluginId)
                            .flatMap(plugin -> datasourceStructureSolution
                                    .getStructure(ds.getId(), false, null)
                                    .map(structure -> applyDatasourceSchemaToContext(
                                            context, safePrompt, safeCurrentValue, plugin, structure))
                                    .defaultIfEmpty(context))
                            .switchIfEmpty(Mono.just(context));
                })
                .switchIfEmpty(Mono.just(context))
                .onErrorResume(e -> {
                    log.debug("Skipping AI datasource schema enrichment: {}", e.getMessage());
                    return Mono.just(context);
                });
    }

    private AIEditorContextDTO applyDatasourceSchemaToContext(
            AIEditorContextDTO context,
            String safePrompt,
            String safeCurrentValue,
            Plugin plugin,
            DatasourceStructure structure) {
        if (structure == null || CollectionUtils.isEmpty(structure.getTables())) {
            return context;
        }
        boolean sqlPlugin = AiDatasourceSchemaSerializerCE.isSqlPluginPackageName(plugin.getPackageName());
        String serialized = sqlPlugin
                ? AiDatasourceSchemaSerializerCE.serializeForSqlPlugin(
                        structure, safePrompt, safeCurrentValue, AI_SCHEMA_CHAR_BUDGET)
                : AiDatasourceSchemaSerializerCE.serializeLegacy(structure, safeCurrentValue, AI_SCHEMA_CHAR_BUDGET);
        if (StringUtils.hasText(serialized)) {
            if (serialized.length() > AI_SCHEMA_CONTEXT_MAX) {
                serialized = serialized.substring(0, AI_SCHEMA_CONTEXT_MAX);
            }
            context.setDatabaseSchema(serialized);
            log.debug(
                    "AI assistant injected datasource schema (sqlPlugin={}, chars={})", sqlPlugin, serialized.length());
        }
        String typeLabel = StringUtils.hasText(plugin.getPluginName())
                ? plugin.getPluginName().trim()
                : plugin.getPackageName();
        if (StringUtils.hasText(typeLabel)) {
            if (typeLabel.length() > 100) {
                typeLabel = typeLabel.substring(0, 100);
            }
            context.setDatasourceType(typeLabel);
        }
        return context;
    }

    private Mono<String> callClaudeAPI(
            String apiKey,
            String prompt,
            AIEditorContextDTO context,
            List<AIMessageDTO> conversationHistory,
            String configModel,
            String configBaseUrl) {
        String systemPrompt = buildSystemPrompt(context);
        String userPrompt = buildUserPrompt(prompt, context);

        if (userPrompt == null || userPrompt.trim().isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Prompt cannot be empty"));
        }

        if (userPrompt.length() > 150000) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Prompt is too long"));
        }

        List<Map<String, Object>> messages = new ArrayList<>();

        if (conversationHistory != null && !conversationHistory.isEmpty()) {
            for (AIMessageDTO msg : conversationHistory) {
                Map<String, Object> historyMsg = new HashMap<>();
                historyMsg.put("role", msg.getRole());
                historyMsg.put("content", msg.getContent());
                messages.add(historyMsg);
            }
        }

        Map<String, Object> messageContent = new HashMap<>();
        messageContent.put("role", "user");
        if (messages.isEmpty()) {
            messageContent.put("content", systemPrompt + "\n\n" + userPrompt);
        } else {
            messageContent.put("content", userPrompt);
        }
        messages.add(messageContent);

        String effectiveModel = resolveConfig(configModel, DEFAULT_CLAUDE_MODEL);
        String effectiveBaseUrl = resolveConfig(configBaseUrl, DEFAULT_CLAUDE_BASE_URL);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", effectiveModel);
        requestBody.put("max_tokens", 8192);
        requestBody.put("messages", messages);
        if (!messages.isEmpty() && conversationHistory != null && !conversationHistory.isEmpty()) {
            requestBody.put("system", systemPrompt);
        }

        return getOrBuildWebClient(effectiveBaseUrl, DEFAULT_CLAUDE_BASE_URL, claudeWebClient)
                .post()
                .uri("/v1/messages")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .body(BodyInserters.fromValue(requestBody))
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> response.bodyToMono(String.class)
                        .flatMap(errorBody -> {
                            int statusCode = response.statusCode().value();
                            if (statusCode == 401 || statusCode == 403) {
                                return Mono.error(
                                        new AppsmithException(AppsmithError.INVALID_CREDENTIALS, "Invalid API key"));
                            } else if (statusCode == 429) {
                                return Mono.error(new AppsmithException(
                                        AppsmithError.INTERNAL_SERVER_ERROR,
                                        "Rate limit exceeded. Please try again later."));
                            }
                            return Mono.error(new AppsmithException(
                                    AppsmithError.INTERNAL_SERVER_ERROR, "AI API request failed"));
                        }))
                .bodyToMono(JsonNode.class)
                .map(this::extractClaudeResponse)
                .doOnError(error -> {
                    if (error instanceof AppsmithException) {
                        log.error("Claude API error for provider: CLAUDE", error);
                    } else {
                        log.error("Unexpected Claude API error", error);
                    }
                });
    }

    private Mono<String> callOpenAIAPI(
            String apiKey,
            String prompt,
            AIEditorContextDTO context,
            List<AIMessageDTO> conversationHistory,
            String configModel,
            String configBaseUrl) {
        String systemPrompt = buildSystemPrompt(context);
        String userPrompt = buildUserPrompt(prompt, context);

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        if (conversationHistory != null && !conversationHistory.isEmpty()) {
            for (AIMessageDTO msg : conversationHistory) {
                messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
            }
        }

        messages.add(Map.of("role", "user", "content", userPrompt));

        String effectiveModel = resolveConfig(configModel, DEFAULT_OPENAI_MODEL);
        String effectiveBaseUrl = resolveConfig(configBaseUrl, DEFAULT_OPENAI_BASE_URL);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", effectiveModel);
        requestBody.put("messages", messages);

        return getOrBuildWebClient(effectiveBaseUrl, DEFAULT_OPENAI_BASE_URL, openaiWebClient)
                .post()
                .uri("/v1/chat/completions")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .body(BodyInserters.fromValue(requestBody))
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> response.bodyToMono(String.class)
                        .flatMap(errorBody -> {
                            int statusCode = response.statusCode().value();
                            if (statusCode == 401 || statusCode == 403) {
                                return Mono.error(
                                        new AppsmithException(AppsmithError.INVALID_CREDENTIALS, "Invalid API key"));
                            } else if (statusCode == 429) {
                                return Mono.error(new AppsmithException(
                                        AppsmithError.INTERNAL_SERVER_ERROR,
                                        "Rate limit exceeded. Please try again later."));
                            }
                            return Mono.error(new AppsmithException(
                                    AppsmithError.INTERNAL_SERVER_ERROR, "AI API request failed"));
                        }))
                .bodyToMono(JsonNode.class)
                .map(this::extractOpenAICompatibleResponse)
                .doOnError(error -> {
                    if (error instanceof AppsmithException) {
                        log.error("OpenAI API error for provider: OPENAI", error);
                    } else {
                        log.error("Unexpected OpenAI API error", error);
                    }
                });
    }

    private Mono<String> callLocalLLMAPI(
            String url,
            String model,
            String prompt,
            AIEditorContextDTO context,
            List<AIMessageDTO> conversationHistory) {
        String systemPrompt = buildSystemPrompt(context);
        String userPrompt = buildUserPrompt(prompt, context);

        if (userPrompt == null || userPrompt.trim().isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Prompt cannot be empty"));
        }

        if (userPrompt.length() > 150000) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Prompt is too long"));
        }

        URI parsedUri;
        try {
            parsedUri = URI.create(url);
            String scheme = parsedUri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                return Mono.error(new AppsmithException(
                        AppsmithError.INVALID_PARAMETER, "Local LLM URL must use http or https scheme"));
            }
            if (parsedUri.getHost() == null || parsedUri.getHost().isEmpty()) {
                return Mono.error(new AppsmithException(
                        AppsmithError.INVALID_PARAMETER,
                        "Local LLM URL must include a valid host and use http or https scheme"));
            }
        } catch (IllegalArgumentException e) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Invalid Local LLM URL"));
        }

        String host = parsedUri.getHost();
        if (host != null) {
            try {
                InetAddress resolved = InetAddress.getByName(host);
                if (resolved.isLinkLocalAddress()) {
                    return Mono.error(new AppsmithException(
                            AppsmithError.INVALID_PARAMETER, "Local LLM URL resolves to a link-local address"));
                }
            } catch (UnknownHostException e) {
                // Let it proceed - will fail at connection time
            }
        }

        String chatUrl;
        if (url.contains("/api/generate")) {
            chatUrl = url.replace("/api/generate", "/api/chat");
        } else if (url.contains("/api/chat")) {
            chatUrl = url;
        } else {
            chatUrl = url.endsWith("/") ? url + "api/chat" : url + "/api/chat";
        }
        URI chatUri = URI.create(chatUrl);
        log.info("Local LLM request: model={}, endpoint={}", model, sanitizeUrlForLog(chatUri));

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        if (conversationHistory != null && !conversationHistory.isEmpty()) {
            for (AIMessageDTO msg : conversationHistory) {
                messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
            }
        }
        messages.add(Map.of("role", "user", "content", userPrompt));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", messages);
        requestBody.put("stream", false);

        HttpClient httpClient = HttpClient.create().responseTimeout(Duration.ofSeconds(120));
        WebClient webClient = WebClient.builder()
                .exchangeStrategies(ExchangeStrategies.builder()
                        .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
                        .build())
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();

        return webClient
                .post()
                .uri(chatUrl)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body(BodyInserters.fromValue(requestBody))
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> response.bodyToMono(String.class)
                        .flatMap(errorBody -> {
                            int statusCode = response.statusCode().value();
                            if (statusCode == 404) {
                                return Mono.error(new AppsmithException(
                                        AppsmithError.INTERNAL_SERVER_ERROR,
                                        "Model not found (404). Ensure '" + model + "' is pulled: ollama pull "
                                                + model));
                            }
                            if (statusCode == 401 || statusCode == 403) {
                                return Mono.error(
                                        new AppsmithException(AppsmithError.INVALID_CREDENTIALS, "Access denied"));
                            }
                            return Mono.error(new AppsmithException(
                                    AppsmithError.INTERNAL_SERVER_ERROR, "Local LLM request failed: " + errorBody));
                        }))
                .bodyToMono(JsonNode.class)
                .map(this::extractLocalLLMResponse)
                .onErrorMap(error -> {
                    if (error instanceof AppsmithException) {
                        return error;
                    }
                    if (error instanceof java.util.concurrent.TimeoutException
                            || error instanceof io.netty.handler.timeout.ReadTimeoutException) {
                        log.error(
                                "Local LLM timed out after 120s: model={}, endpoint={}",
                                model,
                                sanitizeUrlForLog(chatUri));
                        return new AppsmithException(
                                AppsmithError.INTERNAL_SERVER_ERROR,
                                "Local LLM timed out. The model may be loading — try again in a moment, "
                                        + "or use a smaller model. (timeout: 120s)");
                    }
                    if (error instanceof java.net.ConnectException) {
                        log.error(
                                "Cannot connect to Local LLM at {}: {}",
                                sanitizeUrlForLog(chatUri),
                                error.getMessage());
                        return new AppsmithException(
                                AppsmithError.INTERNAL_SERVER_ERROR,
                                "Cannot connect to Local LLM at " + sanitizeUrlForLog(chatUri)
                                        + ". Ensure Ollama is running (ollama serve).");
                    }
                    log.error("Unexpected Local LLM API error: {}", error.getMessage(), error);
                    return new AppsmithException(
                            AppsmithError.INTERNAL_SERVER_ERROR, "Local LLM error: " + error.getMessage());
                });
    }

    private static String sanitizeUrlForLog(URI uri) {
        StringBuilder sb = new StringBuilder();
        if (uri.getScheme() != null) {
            sb.append(uri.getScheme()).append("://");
        }
        if (uri.getHost() != null) {
            sb.append(uri.getHost());
            if (uri.getPort() != -1) {
                sb.append(":").append(uri.getPort());
            }
        }
        if (uri.getPath() != null) {
            sb.append(uri.getPath());
        }
        return sb.toString();
    }

    private static final int MAX_RESPONSE_LENGTH = 200000;

    private String truncateResponse(String response) {
        if (response == null) {
            return "";
        }
        return response.length() <= MAX_RESPONSE_LENGTH ? response : response.substring(0, MAX_RESPONSE_LENGTH);
    }

    private String extractClaudeResponse(JsonNode json) {
        if (json == null || !json.isObject()) {
            return "";
        }
        JsonNode contentArray = json.path("content");
        if (contentArray.isArray() && contentArray.size() > 0) {
            JsonNode firstContent = contentArray.get(0);
            if (firstContent != null && firstContent.isObject()) {
                JsonNode textNode = firstContent.path("text");
                if (textNode != null && textNode.isTextual()) {
                    return truncateResponse(textNode.asText());
                }
            }
        }
        return "";
    }

    private String extractOpenAICompatibleResponse(JsonNode json) {
        if (json == null || !json.isObject()) {
            return "";
        }
        JsonNode choicesArray = json.path("choices");
        if (choicesArray.isArray() && choicesArray.size() > 0) {
            JsonNode firstChoice = choicesArray.get(0);
            if (firstChoice != null && firstChoice.isObject()) {
                JsonNode messageNode = firstChoice.path("message");
                if (messageNode != null && messageNode.isObject()) {
                    JsonNode contentNode = messageNode.path("content");
                    if (contentNode != null && contentNode.isTextual()) {
                        return truncateResponse(contentNode.asText());
                    }
                }
            }
        }
        return "";
    }

    private String extractLocalLLMResponse(JsonNode json) {
        if (json == null || !json.isObject()) {
            return "";
        }
        JsonNode messageNode = json.path("message");
        if (messageNode != null && messageNode.isObject()) {
            JsonNode contentNode = messageNode.path("content");
            if (contentNode != null && contentNode.isTextual()) {
                return truncateResponse(contentNode.asText());
            }
        }
        JsonNode responseNode = json.path("response");
        if (responseNode != null && responseNode.isTextual()) {
            return truncateResponse(responseNode.asText());
        }
        return "";
    }

    private Mono<String> callAzureOpenAIAPI(
            String endpoint,
            String deploymentName,
            String apiKey,
            String prompt,
            AIEditorContextDTO context,
            List<AIMessageDTO> conversationHistory,
            String apiVersion,
            Integer maxCompletionTokens) {
        String systemPrompt = buildSystemPrompt(context);
        String userPrompt = buildUserPrompt(prompt, context);

        String trimmedEndpoint = endpoint.endsWith("/") ? endpoint.substring(0, endpoint.length() - 1) : endpoint;
        String effectiveApiVersion =
                (apiVersion != null && !apiVersion.trim().isEmpty()) ? apiVersion.trim() : DEFAULT_AZURE_API_VERSION;
        int effectiveMaxTokens = (maxCompletionTokens != null && maxCompletionTokens > 0)
                ? maxCompletionTokens
                : DEFAULT_AZURE_MAX_COMPLETION_TOKENS;
        String encodedDeployment = URLEncoder.encode(deploymentName.trim(), StandardCharsets.UTF_8);
        String url = trimmedEndpoint + "/openai/deployments/" + encodedDeployment + "/chat/completions?api-version="
                + effectiveApiVersion;

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        if (conversationHistory != null && !conversationHistory.isEmpty()) {
            for (AIMessageDTO msg : conversationHistory) {
                messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
            }
        }
        messages.add(Map.of("role", "user", "content", userPrompt));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("messages", messages);
        requestBody.put("max_completion_tokens", effectiveMaxTokens);

        WebClient webClient = WebClientUtils.builder()
                .clientConnector(
                        new ReactorClientHttpConnector(HttpClient.create().responseTimeout(Duration.ofSeconds(60))))
                .build();

        return webClient
                .post()
                .uri(url)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .header("api-key", apiKey)
                .body(BodyInserters.fromValue(requestBody))
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> response.bodyToMono(String.class)
                        .flatMap(errorBody -> {
                            int statusCode = response.statusCode().value();
                            log.error(
                                    "Azure OpenAI returned HTTP {}: {}",
                                    statusCode,
                                    errorBody != null && errorBody.length() > 1000
                                            ? errorBody.substring(0, 1000)
                                            : errorBody);
                            if (statusCode == 401 || statusCode == 403) {
                                return Mono.error(
                                        new AppsmithException(AppsmithError.INVALID_CREDENTIALS, "Invalid API key"));
                            } else if (statusCode == 429) {
                                return Mono.error(new AppsmithException(
                                        AppsmithError.INTERNAL_SERVER_ERROR,
                                        "Rate limit exceeded. Please try again later."));
                            }
                            return Mono.error(new AppsmithException(
                                    AppsmithError.INTERNAL_SERVER_ERROR, "Azure OpenAI request failed: " + errorBody));
                        }))
                .bodyToMono(JsonNode.class)
                .map(this::extractOpenAICompatibleResponse)
                .doOnError(error -> {
                    if (error instanceof AppsmithException) {
                        log.error("Azure OpenAI API error", error);
                    } else {
                        log.error("Unexpected Azure OpenAI API error", error);
                    }
                });
    }

    private static boolean hasContent(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private static String trimAndLimit(String value, int maxLength) {
        String trimmed = value.trim();
        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }

    private String buildSystemPrompt(AIEditorContextDTO context) {
        String mode = context != null ? context.getMode() : null;
        String modeReference = aiReferenceService.getReferenceContent(mode);
        String commonIssues = aiReferenceService.getCommonIssuesContent();

        StringBuilder systemPrompt = new StringBuilder();

        if (hasContent(modeReference)) {
            systemPrompt.append(modeReference);
        }

        if (hasContent(commonIssues)) {
            if (systemPrompt.length() > 0) {
                systemPrompt.append("\n\n## Common Issues\n\n");
            }
            systemPrompt.append(commonIssues);
        }

        if (context != null && hasContent(context.getDatabaseSchema())) {
            systemPrompt.append("\n\n## Database Schema\n\n");
            if (hasContent(context.getDatasourceType())) {
                systemPrompt
                        .append("Database type: ")
                        .append(context.getDatasourceType().trim())
                        .append("\n\n");
            }
            systemPrompt.append(context.getDatabaseSchema().trim());
            systemPrompt.append(
                    "\n\nUse the schema above when writing queries. Reference actual table/collection and column/field names. Use the correct query syntax for this database type.");
        }

        systemPrompt.append("\n\n## Response Formatting\n\n"
                + "Format your responses using markdown:\n"
                + "- Use headings (##, ###) to organize sections\n"
                + "- Use **bold** for emphasis on key terms or important points\n"
                + "- Use bullet points or numbered lists for steps and multiple items\n"
                + "- Use fenced code blocks with language identifiers (```javascript, ```sql, etc.) for all code snippets\n"
                + "- Use inline `code` for variable names, function names, and short code references\n"
                + "- Keep explanations concise and well-structured");

        return systemPrompt.toString();
    }

    private String buildUserPrompt(String prompt, AIEditorContextDTO context) {
        String safePrompt = hasContent(prompt) ? prompt.trim() : "";

        if (context == null) {
            return "User request: " + safePrompt + "\n\nProvide the code solution:";
        }

        StringBuilder contextInfo = new StringBuilder();

        if (hasContent(context.getFunctionName())) {
            contextInfo
                    .append("Function: ")
                    .append(trimAndLimit(context.getFunctionName(), 200))
                    .append("\n");
        }
        if (hasContent(context.getFunctionString())) {
            contextInfo
                    .append("Current function code:\n```\n")
                    .append(trimAndLimit(context.getFunctionString(), 50000))
                    .append("\n```\n");
        }
        if (context.getCursorLineNumber() != null
                && context.getCursorLineNumber() >= 0
                && context.getCursorLineNumber() < 1000000) {
            contextInfo
                    .append("Cursor at line: ")
                    .append((long) context.getCursorLineNumber() + 1)
                    .append("\n");
        }

        return contextInfo + "\nUser request: " + safePrompt + "\n\nProvide the code solution:";
    }
}
