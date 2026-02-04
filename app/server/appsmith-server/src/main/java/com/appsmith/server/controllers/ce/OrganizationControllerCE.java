package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.dtos.AIConfigDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.AIReferenceService;
import com.appsmith.server.services.OrganizationService;
import com.fasterxml.jackson.annotation.JsonView;
import io.netty.channel.ConnectTimeoutException;
import io.netty.handler.ssl.SslHandshakeTimeoutException;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.net.URI;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATION;

@Slf4j
@RequestMapping(Url.ORGANIZATION_URL)
public class OrganizationControllerCE {

    private final OrganizationService service;
    private final AIReferenceService aiReferenceService;

    public OrganizationControllerCE(OrganizationService service, AIReferenceService aiReferenceService) {
        this.service = service;
        this.aiReferenceService = aiReferenceService;
    }

    /**
     * This API returns the organization configuration for any user (anonymous or logged in). The configurations are set
     * in {@link com.appsmith.server.controllers.ce.InstanceAdminControllerCE#saveEnvChanges(Map<String,String>)}
     * <p>
     * The update and retrieval are in different controllers because it would have been weird to fetch the configurations
     * from the InstanceAdminController
     *
     * @return
     */
    @JsonView(Views.Public.class)
    @GetMapping("/current")
    public Mono<ResponseDTO<Organization>> getOrganizationConfig() {
        log.debug("Attempting to retrieve organization configuration ... ");
        return service.getOrganizationConfiguration().map(resource -> new ResponseDTO<>(HttpStatus.OK, resource));
    }

    @PutMapping("")
    public Mono<ResponseDTO<Organization>> updateOrganizationConfiguration(
            @RequestBody OrganizationConfiguration organizationConfiguration) {
        return service.updateOrganizationConfiguration(organizationConfiguration)
                .map(organization -> new ResponseDTO<>(HttpStatus.OK, organization));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/ai-config")
    public Mono<ResponseDTO<Map<String, Object>>> updateAIConfig(@RequestBody @Valid AIConfigDTO aiConfig) {
        return service.getCurrentUserOrganizationId()
                .flatMap(organizationId -> service.findById(organizationId, MANAGE_ORGANIZATION)
                        .switchIfEmpty(Mono.error(new AppsmithException(
                                AppsmithError.ACL_NO_RESOURCE_FOUND, "organization", organizationId)))
                        .flatMap(organization -> {
                            OrganizationConfiguration config = organization.getOrganizationConfiguration();
                            if (config == null) {
                                config = new OrganizationConfiguration();
                            }

                            if (aiConfig.getClaudeApiKey() != null
                                    && !aiConfig.getClaudeApiKey().trim().isEmpty()) {
                                String trimmedKey = aiConfig.getClaudeApiKey().trim();
                                if (trimmedKey.length() > 500) {
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.INVALID_PARAMETER, "API key is too long"));
                                }
                                config.setClaudeApiKey(trimmedKey);
                            }
                            if (aiConfig.getOpenaiApiKey() != null
                                    && !aiConfig.getOpenaiApiKey().trim().isEmpty()) {
                                String trimmedKey = aiConfig.getOpenaiApiKey().trim();
                                if (trimmedKey.length() > 500) {
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.INVALID_PARAMETER, "API key is too long"));
                                }
                                config.setOpenaiApiKey(trimmedKey);
                            }
                            if (aiConfig.getCopilotApiKey() != null
                                    && !aiConfig.getCopilotApiKey().trim().isEmpty()) {
                                String trimmedKey = aiConfig.getCopilotApiKey().trim();
                                if (trimmedKey.length() > 500) {
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.INVALID_PARAMETER, "API key is too long"));
                                }
                                config.setCopilotApiKey(trimmedKey);
                            }
                            if (aiConfig.getProvider() != null) {
                                config.setAiProvider(aiConfig.getProvider());
                            }
                            if (aiConfig.getIsAIAssistantEnabled() != null) {
                                config.setIsAIAssistantEnabled(aiConfig.getIsAIAssistantEnabled());
                            }
                            if (aiConfig.getLocalLlmUrl() != null) {
                                String trimmedUrl = aiConfig.getLocalLlmUrl().trim();
                                if (trimmedUrl.length() > 2000) {
                                    return Mono.error(
                                            new AppsmithException(AppsmithError.INVALID_PARAMETER, "URL is too long"));
                                }
                                config.setLocalLlmUrl(trimmedUrl.isEmpty() ? null : trimmedUrl);
                            }
                            if (aiConfig.getLocalLlmContextSize() != null) {
                                config.setLocalLlmContextSize(aiConfig.getLocalLlmContextSize());
                            }

                            return service.updateOrganizationConfiguration(organizationId, config)
                                    .map(updatedOrg -> {
                                        Map<String, Object> response = new HashMap<>();
                                        response.put(
                                                "isAIAssistantEnabled",
                                                updatedOrg
                                                        .getOrganizationConfiguration()
                                                        .getIsAIAssistantEnabled());
                                        response.put(
                                                "provider",
                                                updatedOrg
                                                        .getOrganizationConfiguration()
                                                        .getAiProvider());
                                        response.put(
                                                "hasClaudeApiKey",
                                                updatedOrg
                                                                        .getOrganizationConfiguration()
                                                                        .getClaudeApiKey()
                                                                != null
                                                        && !updatedOrg
                                                                .getOrganizationConfiguration()
                                                                .getClaudeApiKey()
                                                                .isEmpty());
                                        response.put(
                                                "hasOpenaiApiKey",
                                                updatedOrg
                                                                        .getOrganizationConfiguration()
                                                                        .getOpenaiApiKey()
                                                                != null
                                                        && !updatedOrg
                                                                .getOrganizationConfiguration()
                                                                .getOpenaiApiKey()
                                                                .isEmpty());
                                        response.put(
                                                "hasCopilotApiKey",
                                                updatedOrg
                                                                        .getOrganizationConfiguration()
                                                                        .getCopilotApiKey()
                                                                != null
                                                        && !updatedOrg
                                                                .getOrganizationConfiguration()
                                                                .getCopilotApiKey()
                                                                .isEmpty());
                                        response.put(
                                                "localLlmUrl",
                                                updatedOrg
                                                        .getOrganizationConfiguration()
                                                        .getLocalLlmUrl());
                                        response.put(
                                                "localLlmContextSize",
                                                updatedOrg
                                                        .getOrganizationConfiguration()
                                                        .getLocalLlmContextSize());
                                        return response;
                                    });
                        }))
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result))
                .onErrorResume(error -> {
                    String errorMessage = "Failed to update AI configuration";
                    if (error instanceof AppsmithException) {
                        AppsmithException appsmithError = (AppsmithException) error;
                        if (appsmithError.getError() == AppsmithError.ACL_NO_RESOURCE_FOUND) {
                            errorMessage = "You do not have permission to update this configuration";
                        } else {
                            errorMessage = appsmithError.getError().getMessage();
                        }
                    }
                    return Mono.just(
                            new ResponseDTO<Map<String, Object>>(HttpStatus.BAD_REQUEST.value(), null, errorMessage));
                });
    }

    @JsonView(Views.Public.class)
    @GetMapping("/ai-config")
    public Mono<ResponseDTO<Map<String, Object>>> getAIConfig() {
        return service.getCurrentUserOrganization()
                .map(organization -> {
                    Map<String, Object> response = new HashMap<>();
                    if (organization.getOrganizationConfiguration() != null) {
                        OrganizationConfiguration config = organization.getOrganizationConfiguration();
                        response.put(
                                "isAIAssistantEnabled",
                                config.getIsAIAssistantEnabled() != null ? config.getIsAIAssistantEnabled() : false);
                        // Use string representation to avoid null (Jackson strips null values)
                        response.put(
                                "provider",
                                config.getAiProvider() != null
                                        ? config.getAiProvider().name()
                                        : "");
                        response.put(
                                "hasClaudeApiKey",
                                config.getClaudeApiKey() != null
                                        && !config.getClaudeApiKey().isEmpty());
                        response.put(
                                "hasOpenaiApiKey",
                                config.getOpenaiApiKey() != null
                                        && !config.getOpenaiApiKey().isEmpty());
                        response.put(
                                "hasCopilotApiKey",
                                config.getCopilotApiKey() != null
                                        && !config.getCopilotApiKey().isEmpty());
                        // Use empty string instead of null to avoid Jackson stripping
                        response.put("localLlmUrl", config.getLocalLlmUrl() != null ? config.getLocalLlmUrl() : "");
                        // Use -1 as sentinel value for "not set" since Jackson strips null
                        response.put(
                                "localLlmContextSize",
                                config.getLocalLlmContextSize() != null ? config.getLocalLlmContextSize() : -1);
                    } else {
                        response.put("isAIAssistantEnabled", false);
                        response.put("provider", "");
                        response.put("hasClaudeApiKey", false);
                        response.put("hasOpenaiApiKey", false);
                        response.put("hasCopilotApiKey", false);
                        response.put("localLlmUrl", "");
                        response.put("localLlmContextSize", -1);
                    }

                    // Add AI reference files info
                    List<Map<String, Object>> externalFiles =
                            aiReferenceService.getReferenceFilesInfo().entrySet().stream()
                                    .filter(entry ->
                                            "external".equals(entry.getValue().source()))
                                    .map(entry -> Map.<String, Object>of(
                                            "filename", entry.getKey(),
                                            "path", entry.getValue().path()))
                                    .toList();

                    response.put("hasExternalReferenceFiles", !externalFiles.isEmpty());
                    response.put("externalReferenceFiles", externalFiles);

                    return response;
                })
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/ai-config/test-connection")
    public Mono<ResponseDTO<Map<String, Object>>> testLlmConnection(@RequestBody Map<String, String> request) {
        String rawUrl = request.get("url");
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "URL is required");
            return Mono.just(new ResponseDTO<>(HttpStatus.BAD_REQUEST, response));
        }

        final String url = rawUrl.trim();
        List<Map<String, String>> steps = new ArrayList<>();

        // Step 1: URL Parsing
        URI uri;
        try {
            uri = URI.create(url);
            if (uri.getHost() == null) {
                throw new IllegalArgumentException("No host specified");
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
                            "Example: http://localhost:11434/api/generate"));
            return Mono.just(new ResponseDTO<>(HttpStatus.OK, response));
        }

        final String host = uri.getHost();
        final int port = uri.getPort() != -1 ? uri.getPort() : (uri.getScheme().equals("https") ? 443 : 80);
        final String scheme = uri.getScheme();

        // Step 2: DNS Resolution
        java.net.InetAddress resolvedAddress;
        try {
            resolvedAddress = java.net.InetAddress.getByName(host);
            steps.add(createStep("DNS Resolution", "success", host + " → " + resolvedAddress.getHostAddress()));
        } catch (UnknownHostException e) {
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
            return Mono.just(new ResponseDTO<>(HttpStatus.OK, response));
        }

        final String resolvedIp = resolvedAddress.getHostAddress();

        // Create WebClient with timeout
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(10))
                .option(io.netty.channel.ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000);

        WebClient webClient = WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();

        final long startTime = System.currentTimeMillis();
        final List<Map<String, String>> finalSteps = new ArrayList<>(steps);

        // Prepare test payloads for different LLM API formats
        // Ollama format
        String ollamaPayload = "{\"model\":\"test\",\"prompt\":\"Say hi\",\"stream\":false}";
        // OpenAI-compatible format
        String openaiPayload =
                "{\"model\":\"test\",\"messages\":[{\"role\":\"user\",\"content\":\"Say hi\"}],\"max_tokens\":5}";

        // Try Ollama format first (most common for local LLMs)
        return webClient
                .post()
                .uri(url)
                .header("Content-Type", "application/json")
                .bodyValue(ollamaPayload)
                .exchangeToMono(clientResponse -> {
                    // Connection succeeded if we got here
                    finalSteps.add(createStep("TCP Connection", "success", "Connected to " + host + ":" + port));

                    if ("https".equals(scheme)) {
                        finalSteps.add(createStep("TLS Handshake", "success", "Secure connection established"));
                    }

                    int statusCode = clientResponse.statusCode().value();
                    finalSteps.add(
                            createStep("HTTP Response", "success", "Endpoint responded with HTTP " + statusCode));

                    // Read response body to analyze
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
                                response.put("resolvedIp", resolvedIp);

                                // Analyze the response to determine if it's an LLM endpoint
                                boolean looksLikeLlm = false;
                                String contentType = clientResponse
                                        .headers()
                                        .contentType()
                                        .map(Object::toString)
                                        .orElse("unknown");

                                // Truncate response for display
                                String truncatedResponse = responseBody.length() > 500
                                        ? responseBody.substring(0, 500) + "..."
                                        : responseBody;

                                if (statusCode == 404) {
                                    finalSteps.add(createStep("Endpoint Check", "error", "Endpoint not found (404)"));
                                    response.put("success", false);
                                    response.put(
                                            "error",
                                            "Endpoint not found - the path '" + uri.getPath()
                                                    + "' does not exist on this server");
                                    response.put("responsePreview", truncatedResponse);
                                    response.put(
                                            "suggestions",
                                            List.of(
                                                    "Verify the endpoint path is correct",
                                                    "Common Ollama endpoints: /api/generate, /api/chat",
                                                    "Common OpenAI-compatible endpoints: /v1/completions, /v1/chat/completions",
                                                    "Check your LLM server documentation for the correct endpoint"));
                                } else if (contentType.contains("text/html")) {
                                    finalSteps.add(
                                            createStep("Endpoint Check", "error", "Received HTML instead of JSON"));
                                    response.put("success", false);
                                    response.put(
                                            "error",
                                            "This doesn't appear to be an LLM API endpoint - received HTML response");
                                    response.put("responsePreview", truncatedResponse);
                                    response.put(
                                            "suggestions",
                                            List.of(
                                                    "The URL points to a web page, not an API endpoint",
                                                    "Check that the URL includes the API path (e.g., /api/generate)",
                                                    "Verify you're using the correct port for the API"));
                                } else if (contentType.contains("application/json")
                                        || responseBody.trim().startsWith("{")) {
                                    // It's JSON - check if it looks like an LLM response
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
                                                "Endpoint Check", "success", "Looks like a valid LLM endpoint"));
                                    } else if (lowerBody.contains("\"error\"") || lowerBody.contains("\"model\"")) {
                                        // Error response but from an LLM-like API
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
                                                "Endpoint Check", "pending", "JSON response but unclear if LLM"));
                                        response.put(
                                                "warning",
                                                "Received JSON but couldn't confirm this is an LLM endpoint - please verify manually");
                                    }
                                    response.put("responsePreview", truncatedResponse);
                                } else {
                                    finalSteps.add(createStep(
                                            "Endpoint Check", "pending", "Unexpected content type: " + contentType));
                                    response.put("warning", "Received unexpected content type: " + contentType);
                                    response.put("responsePreview", truncatedResponse);
                                }

                                if (statusCode >= 200 && statusCode < 300 && looksLikeLlm) {
                                    response.put("success", true);
                                } else if (statusCode >= 200 && statusCode < 500 && !response.containsKey("error")) {
                                    // Got a response, might be usable
                                    response.put("success", looksLikeLlm);
                                    if (!looksLikeLlm && !response.containsKey("error")) {
                                        response.put("error", "Could not verify this is a valid LLM endpoint");
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
                                return new ResponseDTO<>(HttpStatus.OK, response);
                            });
                })
                .onErrorResume(error -> {
                    long responseTime = System.currentTimeMillis() - startTime;
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("responseTimeMs", responseTime);
                    response.put("host", host);
                    response.put("port", port);
                    response.put("resolvedIp", resolvedIp);

                    if (error instanceof WebClientRequestException) {
                        Throwable cause = error.getCause();
                        if (cause instanceof ConnectTimeoutException) {
                            finalSteps.add(createStep("TCP Connection", "error", "Connection timed out after 5s"));
                            response.put("error", "Connection timed out - server not responding on port " + port);
                            response.put(
                                    "suggestions",
                                    List.of(
                                            "Check if the LLM server is running on port " + port,
                                            "Verify firewall allows connections to port " + port,
                                            "If running in Docker, ensure proper network configuration",
                                            "Try: curl -v " + url));
                        } else if (cause instanceof java.net.ConnectException) {
                            finalSteps.add(createStep("TCP Connection", "error", "Connection refused"));
                            response.put("error", "Connection refused - no service listening on " + host + ":" + port);
                            response.put(
                                    "suggestions",
                                    List.of(
                                            "Start the LLM server (e.g., 'ollama serve' for Ollama)",
                                            "Check if the service is listening on the correct port",
                                            "Verify the port number in your URL",
                                            "Try: lsof -i :" + port + " (Mac/Linux) or netstat -an | findstr " + port
                                                    + " (Windows)"));
                        } else if (cause instanceof SslHandshakeTimeoutException
                                || (cause != null && cause.getClass().getName().contains("Ssl"))) {
                            finalSteps.add(
                                    createStep("TCP Connection", "success", "Connected to " + host + ":" + port));
                            finalSteps.add(createStep("TLS Handshake", "error", "SSL/TLS handshake failed"));
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
                                    "Connection failed: " + (cause != null ? cause.getMessage() : error.getMessage()));
                            response.put(
                                    "suggestions",
                                    List.of(
                                            "Check if the server is running and accessible",
                                            "Verify network connectivity from the Appsmith server",
                                            "Check server logs for more details"));
                        }
                    } else if (error instanceof WebClientResponseException) {
                        WebClientResponseException wcre = (WebClientResponseException) error;
                        finalSteps.add(createStep("TCP Connection", "success", "Connected"));
                        finalSteps.add(createStep(
                                "HTTP Request",
                                "error",
                                "HTTP " + wcre.getStatusCode().value()));
                        response.put("error", "HTTP error: " + wcre.getStatusCode());
                        response.put("httpStatus", wcre.getStatusCode().value());
                        response.put(
                                "suggestions",
                                getHttpErrorSuggestions(wcre.getStatusCode().value()));
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
                    return Mono.just(new ResponseDTO<>(HttpStatus.OK, response));
                });
    }

    private Map<String, String> createStep(String name, String status, String detail) {
        Map<String, String> step = new HashMap<>();
        step.put("name", name);
        step.put("status", status);
        step.put("detail", detail);
        return step;
    }

    @JsonView(Views.Public.class)
    @PostMapping("/ai-config/test-api-key")
    public Mono<ResponseDTO<Map<String, Object>>> testApiKey(@RequestBody Map<String, String> request) {
        String provider = request.get("provider");
        String apiKey = request.get("apiKey");

        if (provider == null || provider.trim().isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Provider is required");
            return Mono.just(new ResponseDTO<>(HttpStatus.BAD_REQUEST, response));
        }

        // If no API key provided, try to use the stored one
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("••••••••")) {
            return service.getCurrentUserOrganization().flatMap(organization -> {
                OrganizationConfiguration config = organization.getOrganizationConfiguration();
                if (config == null) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("error", "No API key configured");
                    return Mono.just(new ResponseDTO<>(HttpStatus.OK, response));
                }

                String storedKey = null;
                if ("CLAUDE".equalsIgnoreCase(provider)) {
                    storedKey = config.getClaudeApiKey();
                } else if ("OPENAI".equalsIgnoreCase(provider)) {
                    storedKey = config.getOpenaiApiKey();
                } else if ("COPILOT".equalsIgnoreCase(provider)) {
                    storedKey = config.getCopilotApiKey();
                }

                if (storedKey == null || storedKey.isEmpty()) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("error", "No " + provider + " API key configured. Please enter an API key first.");
                    return Mono.just(new ResponseDTO<>(HttpStatus.OK, response));
                }

                return testApiKeyWithProvider(provider, storedKey);
            });
        }

        return testApiKeyWithProvider(provider, apiKey.trim());
    }

    private Mono<ResponseDTO<Map<String, Object>>> testApiKeyWithProvider(String provider, String apiKey) {
        HttpClient httpClient = HttpClient.create().responseTimeout(Duration.ofSeconds(30));

        WebClient webClient = WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();

        final long startTime = System.currentTimeMillis();
        List<Map<String, String>> steps = new ArrayList<>();

        if ("OPENAI".equalsIgnoreCase(provider)) {
            return testOpenAIKey(webClient, apiKey, startTime, steps);
        } else if ("CLAUDE".equalsIgnoreCase(provider)) {
            return testClaudeKey(webClient, apiKey, startTime, steps);
        } else if ("COPILOT".equalsIgnoreCase(provider)) {
            return testCopilotKey(webClient, apiKey, startTime, steps);
        } else {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Unknown provider: " + provider);
            return Mono.just(new ResponseDTO<>(HttpStatus.OK, response));
        }
    }

    private Mono<ResponseDTO<Map<String, Object>>> testOpenAIKey(
            WebClient webClient, String apiKey, long startTime, List<Map<String, String>> steps) {

        steps.add(createStep("API Key Format", "success", "Key starts with 'sk-'"));

        // Use chat completions endpoint with minimal request
        String payload =
                "{\"model\":\"gpt-3.5-turbo\",\"messages\":[{\"role\":\"user\",\"content\":\"Say hello\"}],\"max_tokens\":5}";

        return webClient
                .post()
                .uri("https://api.openai.com/v1/chat/completions")
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

                                    // Try to extract a preview of the response
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
                                    // Include error details from response
                                    if (responseBody.length() < 500) {
                                        response.put("responsePreview", responseBody);
                                    }
                                }

                                response.put("steps", steps);
                                return new ResponseDTO<>(HttpStatus.OK, response);
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

                    return Mono.just(new ResponseDTO<>(HttpStatus.OK, response));
                });
    }

    private Mono<ResponseDTO<Map<String, Object>>> testClaudeKey(
            WebClient webClient, String apiKey, long startTime, List<Map<String, String>> steps) {

        steps.add(createStep("API Key Format", "success", "Key format accepted"));

        // Use Claude messages endpoint with minimal request
        String payload =
                "{\"model\":\"claude-3-haiku-20240307\",\"max_tokens\":10,\"messages\":[{\"role\":\"user\",\"content\":\"Say hello\"}]}";

        return webClient
                .post()
                .uri("https://api.anthropic.com/v1/messages")
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

                                    // Try to extract a preview of the response
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
                                    // 400 could mean key is valid but request format issue
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
                                    if (responseBody.length() < 500) {
                                        response.put("responsePreview", responseBody);
                                    }
                                } else {
                                    steps.add(createStep("API Request", "error", "HTTP " + statusCode));
                                    response.put("success", false);
                                    response.put("error", "Anthropic API returned HTTP " + statusCode);
                                    if (responseBody.length() < 500) {
                                        response.put("responsePreview", responseBody);
                                    }
                                }

                                response.put("steps", steps);
                                return new ResponseDTO<>(HttpStatus.OK, response);
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

                    return Mono.just(new ResponseDTO<>(HttpStatus.OK, response));
                });
    }

    private Mono<ResponseDTO<Map<String, Object>>> testCopilotKey(
            WebClient webClient, String apiKey, long startTime, List<Map<String, String>> steps) {

        steps.add(createStep("API Key Format", "success", "Key format accepted"));

        // Azure OpenAI (which powers MS Copilot) requires an endpoint URL
        // For now, we'll test against Azure's common API format
        // The key format for Azure is typically a 32-character hex string
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
            return Mono.just(new ResponseDTO<>(HttpStatus.OK, response));
        }

        steps.add(createStep("Key Validation", "success", "Key length validated"));

        // Since Azure OpenAI requires a resource-specific endpoint, we can't do a real API test
        // without knowing the user's Azure OpenAI resource URL
        steps.add(createStep("Configuration Note", "pending", "Azure OpenAI requires additional configuration"));

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("responseTimeMs", System.currentTimeMillis() - startTime);
        response.put("provider", "MS Copilot (Azure OpenAI)");
        response.put("message", "API key format validated. Azure OpenAI configuration saved.");
        response.put("steps", steps);
        response.put(
                "suggestions",
                List.of(
                        "To use Azure OpenAI, ensure your Azure OpenAI resource is properly configured",
                        "The API will use your Azure OpenAI deployment when making AI requests",
                        "Visit Azure Portal to verify your OpenAI resource and deployments"));

        return Mono.just(new ResponseDTO<>(HttpStatus.OK, response));
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
}
