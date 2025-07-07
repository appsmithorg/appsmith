package com.external.plugins.constants;

import org.springframework.web.reactive.function.client.ExchangeStrategies;

public class DeepseekAIConstants {

    // Endpoints
    public static final String DEEPSEEK_AI_HOST = "https://api.deepseek.com";
    public static final String MODELS_ENDPOINT = "/models";
    public static final String CHAT_ENDPOINT = "/chat/completions";
    public static final String BALANCE_ENDPOINT = "/user/balance";


    // COMMANDS
    public static final String CHAT_MODELS = "CHAT_MODELS";
    public static final String CHAT_ROLES = "CHAT_ROLES";
    public static final String CHAT = "CHAT";
    public static final String BALANCE = "BALANCE";


    // Form data constants
    public static final String CHAT_MODEL_SELECTOR = "chatModel";
    public static final String DATA = "data";
    public static final String ID = "id";
    public static final String LABEL = "label";
    public static final String VALUE = "value";
    public static final String COMMAND = "command";
    public static final String MODEL = "model";
    public static final String MESSAGES = "messages";
    public static final String VIEW_TYPE = "viewType";
    public static final String TEMPERATURE = "temperature";
    public static final String TOP_P = "topP";
    public static final String MAX_TOKENS = "maxTokens";
    public static final String FREQUENCY_PENALTY = "frequencyPenalty";
    public static final String PRESENCE_PENALTY = "presencePenalty";
    public static final String RESPONSE_FORMAT = "responseFormat";
    public static final String STREAM = "stream";


    // Other constants
    public static final String BODY = "body";
    public static final String JSON = "json";

    public static final ExchangeStrategies EXCHANGE_STRATEGIES = ExchangeStrategies.builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(/* 100MB */ 100 * 1024 * 1024))
            .build();
}
