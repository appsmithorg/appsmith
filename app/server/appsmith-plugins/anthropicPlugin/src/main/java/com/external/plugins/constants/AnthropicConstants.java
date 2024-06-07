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
    // chat v2 includes claude-3 models
    public static final String CHAT_V2 = "CHAT_V2";
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
    public static final String CLAUDE3_PREFIX = "claude-3";
    public static final String MODEL = "model";
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
    public static final Map<String, List<String>> ANTHROPIC_MODELS = Map.of(
            CHAT,
                    List.of(
                            "claude-instant-1.2",
                            "claude-2.1",
                            "claude-3-opus-20240229",
                            "claude-3-sonnet-20240229",
                            "claude-3-haiku-20240307"),
            VISION, List.of("claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"));
    public static final String CLOUD_SERVICES = "https://cs.appsmith.com";
    public static final String MODELS_API = "/api/v1/ai/models";
    public static final String PROVIDER = "provider";
    public static final String ANTHROPIC = "anthropic";
    public static final String TEST_MODEL = "claude-instant-1.2";
    public static final String TEST_PROMPT = "Human:Hey Assistant:";
    public static final ExchangeStrategies EXCHANGE_STRATEGIES = ExchangeStrategies.builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(/* 10MB */ 10 * 1024 * 1024))
            .build();
    public static final String JSON = "json";
    public static final String COMPONENT = "component";
}
