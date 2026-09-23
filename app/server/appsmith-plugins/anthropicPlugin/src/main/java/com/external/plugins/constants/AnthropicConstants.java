package com.external.plugins.constants;

import org.springframework.web.reactive.function.client.ExchangeStrategies;

import java.util.List;
import java.util.Map;

public class AnthropicConstants {
    public static final String ANTHROPIC_API_ENDPOINT = "https://api.anthropic.com/v1";
    public static final String COMPLETION_API = "/complete";
    public static final String MESSAGE_API = "/messages";
    public static final String CHAT_MODELS = "CHAT_MODELS";
    public static final String VISION_MODELS = "VISION_MODELS";
    public static final String CHAT = "CHAT";
    public static final String VISION = "VISION";
    public static final String COMMAND = "command";
    public static final String DATA = "data";
    public static final String TEXT = "text";
    public static final String IMAGE = "image";
    public static final String BASE64 = "base64";
    public static final String SYSTEM_PROMPT = "systemPrompt";
    public static final String VIEW_TYPE = "viewType";
    public static final String COMPONENT_DATA = "componentData";
    public static final String BODY = "body";
    public static final String ROLE = "role";
    public static final String TYPE = "type";
    public static final String CONTENT = "content";
    public static final String MODEL = "model";
    public static final String ID = "id";
    public static final String CHAT_MODEL_SELECTOR = "chatModel";
    public static final String VISION_MODEL_SELECTOR = "visionModel";
    public static final String MESSAGES = "messages";
    public static final String TEMPERATURE = "temperature";
    public static final String MAX_TOKENS = "maxTokens";
    public static final Integer DEFAULT_MAX_TOKEN = 256;
    public static final Float DEFAULT_TEMPERATURE = 1.0f;
    public static final String LABEL = "label";
    public static final String VALUE = "value";
    public static final String API_KEY_HEADER = "x-api-key";
    public static final String ANTHROPIC_VERSION_HEADER = "anthropic-version";
    public static final String ANTHROPIC_VERSION = "2023-06-01";
    // Fallback lists used when the live GET /v1/models call fails, keyed by trigger request type.
    // All current Claude models accept both text and image input, so chat and vision share one list.
    private static final List<String> FALLBACK_MODELS = List.of(
            "claude-fable-5",
            "claude-opus-5",
            "claude-sonnet-5",
            "claude-haiku-4-5",
            "claude-opus-4-8",
            "claude-sonnet-4-6");
    public static final Map<String, List<String>> ANTHROPIC_MODELS =
            Map.of(CHAT_MODELS, FALLBACK_MODELS, VISION_MODELS, FALLBACK_MODELS);
    public static final String MODELS_API = "/models";
    // single page at the API's maximum page size; pagination deliberately skipped
    public static final int MODELS_PAGE_LIMIT = 1000;
    public static final ExchangeStrategies EXCHANGE_STRATEGIES = ExchangeStrategies.builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(/* 10MB */ 10 * 1024 * 1024))
            .build();
    public static final String JSON = "json";
    public static final String COMPONENT = "component";
}
