package com.appsmith.server.services.ce;

import com.appsmith.server.domains.AIProvider;
import com.appsmith.server.dtos.AIEditorContextDTO;
import com.appsmith.server.dtos.AIMessageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.AIReferenceService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.util.WebClientUtils;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIAssistantServiceCEImpl implements AIAssistantServiceCE {

    private final OrganizationService organizationService;
    private final AIReferenceService aiReferenceService;

    private static final WebClient claudeWebClient = WebClientUtils.builder()
            .baseUrl("https://api.anthropic.com")
            .clientConnector(
                    new ReactorClientHttpConnector(HttpClient.create().responseTimeout(Duration.ofSeconds(60))))
            .build();

    private static final WebClient openaiWebClient = WebClientUtils.builder()
            .baseUrl("https://api.openai.com")
            .clientConnector(
                    new ReactorClientHttpConnector(HttpClient.create().responseTimeout(Duration.ofSeconds(60))))
            .build();

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

            var orgConfig = organization.getOrganizationConfiguration();
            if (!Boolean.TRUE.equals(orgConfig.getIsAIAssistantEnabled())) {
                return Mono.error(new AppsmithException(
                        AppsmithError.INVALID_PARAMETER,
                        "AI Assistant is disabled. Please contact your administrator."));
            }

            // LOCAL_LLM uses URL + model, not API key
            if (providerEnum == AIProvider.LOCAL_LLM) {
                String url = orgConfig.getLocalLlmUrl();
                String model = orgConfig.getLocalLlmModel();
                if (url == null || url.trim().isEmpty()) {
                    return Mono.error(
                            new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "Local LLM URL not configured"));
                }
                if (model == null || model.trim().isEmpty()) {
                    return Mono.error(
                            new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "Local LLM model not configured"));
                }
                return callLocalLLMAPI(url.trim(), model.trim(), prompt, context, conversationHistory);
            }

            // COPILOT uses endpoint + API key
            if (providerEnum == AIProvider.COPILOT) {
                String apiKey = orgConfig.getCopilotApiKey();
                String endpoint = orgConfig.getCopilotEndpoint();
                if (apiKey == null || apiKey.trim().isEmpty()) {
                    return Mono.error(
                            new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "Copilot API key not configured"));
                }
                if (endpoint == null || endpoint.trim().isEmpty()) {
                    return Mono.error(
                            new AppsmithException(
                                    AppsmithError.NO_RESOURCE_FOUND,
                                    "Copilot endpoint not configured. Add your Azure OpenAI chat completions URL (e.g. https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT/chat/completions?api-version=2024-10-21)"));
                }
                return callCopilotAPI(endpoint.trim(), apiKey, prompt, context, conversationHistory);
            }

            // CLAUDE and OPENAI use API key
            String apiKey =
                    switch (providerEnum) {
                        case CLAUDE -> orgConfig.getClaudeApiKey();
                        case OPENAI -> orgConfig.getOpenaiApiKey();
                        default -> null;
                    };

            if (apiKey == null || apiKey.trim().isEmpty()) {
                return Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, "API key not configured for this provider"));
            }

            return switch (providerEnum) {
                case CLAUDE -> callClaudeAPI(apiKey, prompt, context, conversationHistory);
                case OPENAI -> callOpenAIAPI(apiKey, prompt, context, conversationHistory);
                default -> Mono.error(
                        new AppsmithException(AppsmithError.INVALID_PARAMETER, "Provider not supported: " + provider));
            };
        });
    }

    private Mono<String> callClaudeAPI(
            String apiKey, String prompt, AIEditorContextDTO context, List<AIMessageDTO> conversationHistory) {
        String systemPrompt = buildSystemPrompt(context);
        String userPrompt = buildUserPrompt(prompt, context);

        if (userPrompt == null || userPrompt.trim().isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Prompt cannot be empty"));
        }

        if (userPrompt.length() > 150000) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Prompt is too long"));
        }

        List<Map<String, Object>> messages = new ArrayList<>();

        // Add conversation history if present
        if (conversationHistory != null && !conversationHistory.isEmpty()) {
            for (AIMessageDTO msg : conversationHistory) {
                Map<String, Object> historyMsg = new HashMap<>();
                historyMsg.put("role", msg.getRole());
                historyMsg.put("content", msg.getContent());
                messages.add(historyMsg);
            }
        }

        // Add current user message with system context
        Map<String, Object> messageContent = new HashMap<>();
        messageContent.put("role", "user");
        // Include system prompt only in first message or if no history
        if (messages.isEmpty()) {
            messageContent.put("content", systemPrompt + "\n\n" + userPrompt);
        } else {
            messageContent.put("content", userPrompt);
        }
        messages.add(messageContent);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "claude-3-5-sonnet-20241022");
        requestBody.put("max_tokens", 8192);
        requestBody.put("messages", messages);
        // Add system prompt as separate field for Claude
        if (!messages.isEmpty() && conversationHistory != null && !conversationHistory.isEmpty()) {
            requestBody.put("system", systemPrompt);
        }

        return claudeWebClient
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
                .map(json -> {
                    if (json == null || !json.isObject()) {
                        return "";
                    }
                    JsonNode contentArray = json.path("content");
                    if (contentArray.isArray() && contentArray.size() > 0) {
                        JsonNode firstContent = contentArray.get(0);
                        if (firstContent != null && firstContent.isObject()) {
                            JsonNode textNode = firstContent.path("text");
                            if (textNode != null && textNode.isTextual()) {
                                String response = textNode.asText();
                                if (response != null && response.length() > 200000) {
                                    return response.substring(0, 200000);
                                }
                                return response;
                            }
                        }
                    }
                    return "";
                })
                .doOnError(error -> {
                    if (error instanceof AppsmithException) {
                        log.error("Claude API error for provider: CLAUDE", error);
                    } else {
                        log.error("Unexpected Claude API error", error);
                    }
                });
    }

    private Mono<String> callOpenAIAPI(
            String apiKey, String prompt, AIEditorContextDTO context, List<AIMessageDTO> conversationHistory) {
        String systemPrompt = buildSystemPrompt(context);
        String userPrompt = buildUserPrompt(prompt, context);

        List<Map<String, Object>> messages = new ArrayList<>();
        // Always add system prompt first for OpenAI
        messages.add(Map.of("role", "system", "content", systemPrompt));

        // Add conversation history if present
        if (conversationHistory != null && !conversationHistory.isEmpty()) {
            for (AIMessageDTO msg : conversationHistory) {
                messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
            }
        }

        // Add current user message
        messages.add(Map.of("role", "user", "content", userPrompt));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "gpt-4");
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);

        return openaiWebClient
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
                .map(json -> {
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
                                    String response = contentNode.asText();
                                    if (response != null && response.length() > 200000) {
                                        return response.substring(0, 200000);
                                    }
                                    return response;
                                }
                            }
                        }
                    }
                    return "";
                })
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

        // Ollama uses /api/chat with messages format (OpenAI-compatible)
        // Normalize the URL: if user provided /api/generate, swap to /api/chat
        // If user provided a base URL (no /api/ path), append /api/chat
        String chatUrl;
        if (url.contains("/api/generate")) {
            chatUrl = url.replace("/api/generate", "/api/chat");
        } else if (url.contains("/api/chat")) {
            chatUrl = url;
        } else {
            // Base URL like http://localhost:11434 — append /api/chat
            chatUrl = url.endsWith("/") ? url + "api/chat" : url + "/api/chat";
        }
        log.info("Local LLM request: model={}, url={} -> chatUrl={}", model, url, chatUrl);

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

        // Build WebClient WITHOUT WebClientUtils SSRF protection since Local LLM
        // is explicitly admin-configured and typically runs on localhost/private networks.
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
                .map(json -> extractLocalLLMResponse(json))
                .onErrorMap(error -> {
                    if (error instanceof AppsmithException) {
                        return error;
                    }
                    if (error instanceof java.util.concurrent.TimeoutException
                            || error instanceof io.netty.handler.timeout.ReadTimeoutException) {
                        log.error("Local LLM timed out after 120s: model={}, url={}", model, chatUrl);
                        return new AppsmithException(
                                AppsmithError.INTERNAL_SERVER_ERROR,
                                "Local LLM timed out. The model may be loading — try again in a moment, "
                                        + "or use a smaller model. (timeout: 120s)");
                    }
                    if (error instanceof java.net.ConnectException) {
                        log.error("Cannot connect to Local LLM at {}: {}", chatUrl, error.getMessage());
                        return new AppsmithException(
                                AppsmithError.INTERNAL_SERVER_ERROR,
                                "Cannot connect to Local LLM at " + chatUrl
                                        + ". Ensure Ollama is running (ollama serve).");
                    }
                    log.error("Unexpected Local LLM API error: {}", error.getMessage(), error);
                    return new AppsmithException(
                            AppsmithError.INTERNAL_SERVER_ERROR, "Local LLM error: " + error.getMessage());
                });
    }

    private String extractLocalLLMResponse(JsonNode json) {
        if (json == null || !json.isObject()) {
            return "";
        }
        // Ollama /api/chat response: { "message": { "content": "..." } }
        JsonNode messageNode = json.path("message");
        if (messageNode != null && messageNode.isObject()) {
            JsonNode contentNode = messageNode.path("content");
            if (contentNode != null && contentNode.isTextual()) {
                String response = contentNode.asText();
                return response != null && response.length() <= 200000 ? response : response.substring(0, 200000);
            }
        }
        // Ollama /api/generate response: { "response": "..." }
        JsonNode responseNode = json.path("response");
        if (responseNode != null && responseNode.isTextual()) {
            String response = responseNode.asText();
            return response != null && response.length() <= 200000 ? response : response.substring(0, 200000);
        }
        return "";
    }

    private Mono<String> callCopilotAPI(
            String endpoint,
            String apiKey,
            String prompt,
            AIEditorContextDTO context,
            List<AIMessageDTO> conversationHistory) {
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

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);

        WebClient webClient = WebClientUtils.builder()
                .clientConnector(
                        new ReactorClientHttpConnector(HttpClient.create().responseTimeout(Duration.ofSeconds(60))))
                .build();

        return webClient
                .post()
                .uri(endpoint)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .header("api-key", apiKey)
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
                                    AppsmithError.INTERNAL_SERVER_ERROR, "Azure OpenAI request failed: " + errorBody));
                        }))
                .bodyToMono(JsonNode.class)
                .map(json -> {
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
                                    String response = contentNode.asText();
                                    return response != null && response.length() <= 200000
                                            ? response
                                            : response.substring(0, 200000);
                                }
                            }
                        }
                    }
                    return "";
                })
                .doOnError(error -> {
                    if (error instanceof AppsmithException) {
                        log.error("Copilot (Azure OpenAI) API error", error);
                    } else {
                        log.error("Unexpected Copilot API error", error);
                    }
                });
    }

    private String buildSystemPrompt(AIEditorContextDTO context) {
        String mode = context != null ? context.getMode() : null;

        // Get mode-specific reference content
        String modeReference = aiReferenceService.getReferenceContent(mode);

        // Get common issues content (appended for all modes)
        String commonIssues = aiReferenceService.getCommonIssuesContent();

        // Build complete system prompt
        StringBuilder systemPrompt = new StringBuilder();

        if (modeReference != null && !modeReference.isEmpty()) {
            systemPrompt.append(modeReference);
        }

        if (commonIssues != null && !commonIssues.isEmpty()) {
            if (systemPrompt.length() > 0) {
                systemPrompt.append("\n\n## Common Issues\n\n");
            }
            systemPrompt.append(commonIssues);
        }

        return systemPrompt.toString();
    }

    private String buildUserPrompt(String prompt, AIEditorContextDTO context) {
        if (prompt == null || prompt.trim().isEmpty()) {
            prompt = "";
        }

        if (context == null) {
            return "User request: " + prompt.trim() + "\n\nProvide the code solution:";
        }

        StringBuilder contextInfo = new StringBuilder();
        if (context.getFunctionName() != null
                && !context.getFunctionName().trim().isEmpty()) {
            String functionName = context.getFunctionName().trim();
            if (functionName.length() > 200) {
                functionName = functionName.substring(0, 200);
            }
            contextInfo.append("Function: ").append(functionName).append("\n");
        }
        if (context.getFunctionString() != null
                && !context.getFunctionString().trim().isEmpty()) {
            String functionString = context.getFunctionString().trim();
            if (functionString.length() > 50000) {
                functionString = functionString.substring(0, 50000);
            }
            contextInfo
                    .append("Current function code:\n```\n")
                    .append(functionString)
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
        return contextInfo + "\nUser request: " + prompt.trim() + "\n\nProvide the code solution:";
    }
}
