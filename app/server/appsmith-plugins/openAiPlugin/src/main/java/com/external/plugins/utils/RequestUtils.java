package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.BearerTokenAuth;
import com.external.plugins.models.ChatMessage;
import com.external.plugins.models.ChatRequestDTO;
import com.external.plugins.models.EmbeddingRequestDTO;
import com.external.plugins.models.OpenAIRequestDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.OpenAIConstants.CHAT;
import static com.external.plugins.constants.OpenAIConstants.CHAT_ENDPOINT;
import static com.external.plugins.constants.OpenAIConstants.COMMAND;
import static com.external.plugins.constants.OpenAIConstants.DATA;
import static com.external.plugins.constants.OpenAIConstants.EMBEDDINGS;
import static com.external.plugins.constants.OpenAIConstants.EMBEDDINGS_ENDPOINT;
import static com.external.plugins.constants.OpenAIConstants.EXCHANGE_STRATEGIES;
import static com.external.plugins.constants.OpenAIConstants.MESSAGES;
import static com.external.plugins.constants.OpenAIConstants.MODEL;
import static com.external.plugins.constants.OpenAIConstants.MODELS_ENDPOINT;
import static com.external.plugins.constants.OpenAIConstants.OPEN_AI_HOST;

public class RequestUtils {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static OpenAIRequestDTO makeRequestBody(ActionConfiguration actionConfiguration) {

        Map<String, Object> formData = actionConfiguration.getFormData();
        if (CollectionUtils.isEmpty(formData)) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
        }

        String command = extractDataFromFormData(formData, COMMAND);
        if (CHAT.equals(command)) {
            return makeChatRequestBody(actionConfiguration, formData);
        } else if (EMBEDDINGS.equals(command)) {
            return makeEmbeddingRequestBody(actionConfiguration, formData);
        } else {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
        }
    }

    protected static ChatRequestDTO makeChatRequestBody(
            ActionConfiguration actionConfiguration, Map<String, Object> formData) {
        ChatRequestDTO chatRequestDTO = new ChatRequestDTO();

        String model = extractDataFromFormData(formData, MODEL);

        if (!StringUtils.hasText(model)) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
        }

        chatRequestDTO.setModel(model);
        List<ChatMessage> chatMessages = transformToMessages((String) formData.get(MESSAGES));
        verifyRoleForChatMessages(chatMessages);
        chatRequestDTO.setMessages(chatMessages);
        // set Messages
        return chatRequestDTO;
    }

    private static String extractDataFromFormData(Map<String, Object> formData, String key) {
        return (String) ((Map<String, Object>) formData.get(key)).get(DATA);
    }

    protected static void verifyRoleForChatMessages(List<ChatMessage> chatMessages) {
        for (ChatMessage chatMessage : chatMessages) {
            if (chatMessage.getRole() == null) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
            }
        }
    }

    protected static List<ChatMessage> transformToMessages(String messages) {
        if (!StringUtils.hasText(messages)) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
        }

        try {
            return objectMapper.readValue(messages, new TypeReference<List<ChatMessage>>() {});
        } catch (JsonProcessingException jsonProcessingException) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
        }
    }

    protected static EmbeddingRequestDTO makeEmbeddingRequestBody(
            ActionConfiguration actionConfiguration, Map<String, Object> formData) {
        EmbeddingRequestDTO embeddingRequestDTO = new EmbeddingRequestDTO();
        return embeddingRequestDTO;
    }

    public static URI createUri(ActionConfiguration actionConfiguration) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        if (CollectionUtils.isEmpty(formData)) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
        }

        String command = extractDataFromFormData(formData, COMMAND);
        return createUriFromCommand(command);
    }

    public static URI createUriFromCommand(String command) {
        if (CHAT.equals(command)) {
            return URI.create(OPEN_AI_HOST + CHAT_ENDPOINT);
        } else if (EMBEDDINGS.equals(command)) {
            return URI.create(OPEN_AI_HOST + EMBEDDINGS_ENDPOINT);
        } else if (MODEL.equals(command)) {
            return URI.create(OPEN_AI_HOST + MODELS_ENDPOINT);
        } else {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR);
        }
    }

    public static Mono<ResponseEntity<String>> makeRequest(
            HttpMethod httpMethod,
            URI uri,
            BearerTokenAuth bearerTokenAuth,
            BodyInserter<?, ? super ClientHttpRequest> body) {

        // Initializing webClient to be used for http call
        WebClient.Builder webClientBuilder = WebClient.builder();
        WebClient client =
                webClientBuilder.exchangeStrategies(EXCHANGE_STRATEGIES).build();

        // Authentication will already be valid at this point
        assert (bearerTokenAuth.getAuthenticationResponse() != null);

        return client.method(httpMethod)
                .uri(uri)
                .body(body)
                .headers(headers -> headers.set("Authorization", "Bearer " + bearerTokenAuth.getBearerToken()))
                .exchangeToMono(clientResponse -> clientResponse.toEntity(String.class));
    }
}
