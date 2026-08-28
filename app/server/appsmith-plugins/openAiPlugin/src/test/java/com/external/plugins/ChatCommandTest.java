package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.commands.ChatCommand;
import com.external.plugins.models.ChatRequestDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import org.json.JSONObject;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.OpenAIConstants.CHAT_MODEL_SELECTOR;
import static com.external.plugins.constants.OpenAIConstants.DATA;
import static com.external.plugins.constants.OpenAIConstants.ID;
import static com.external.plugins.constants.OpenAIConstants.TEMPERATURE;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class ChatCommandTest {

    private static final Gson gson = new Gson();

    @Test
    public void testCreateTriggerUri() {
        ChatCommand command = new ChatCommand(gson);
        URI uri = command.createTriggerUri();
        assertEquals("/v1/models", uri.getPath());
    }

    @Test
    public void testCreateExecutionUri() {
        ChatCommand command = new ChatCommand(gson);
        URI uri = command.createExecutionUri();

        assertEquals("/v1/chat/completions", uri.getPath());
    }

    @Test
    public void testMakeRequestBody_withValidData() {
        // Test with valid form data

        ChatCommand command = new ChatCommand(gson);

        Map<String, Object> formData = new HashMap<>();
        formData.put(CHAT_MODEL_SELECTOR, Map.of(DATA, "gpt-3.5-turbo"));

        Object messages = List.of(
                Map.of("role", "user", "content", "Hello"), Map.of("role", "assistant", "content", "Hi there!"));
        formData.put("messages", Map.of("data", messages));
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);

        ChatRequestDTO request = (ChatRequestDTO) command.makeRequestBody(actionConfiguration);

        assertEquals("gpt-3.5-turbo", request.getModel());
        assertNotNull(request.getMessages());
        assertEquals(2, request.getMessages().size());
    }

    @Test
    public void testModelFilter() {
        List<String> models = List.of(
                "text-search-babbage-doc-001",
                "gpt-3.5-turbo-16k-0613",
                "curie-search-query",
                "gpt-3.5-turbo-16k",
                "text-search-babbage-query-001",
                "babbage",
                "babbage-search-query",
                "text-babbage-001",
                "whisper-1",
                "text-similarity-davinci-001",
                "davinci-similarity",
                "code-davinci-edit-001",
                "curie-similarity",
                "babbage-search-document",
                "curie-instruct-beta",
                "text-search-ada-doc-001",
                "davinci-instruct-beta",
                "gpt-3.5-turbo-0613",
                "text-similarity-babbage-001",
                "text-search-davinci-doc-001",
                "gpt-4-0314",
                "gpt-4-0613",
                "gpt-4",
                "babbage-similarity",
                "text-embedding-ada-002",
                "davinci-search-query",
                "text-similarity-curie-001",
                "text-davinci-001",
                "text-search-davinci-query-001",
                "ada-search-document",
                "ada-code-search-code",
                "babbage-002",
                "davinci-002",
                "davinci-search-document",
                "curie-search-document",
                "babbage-code-search-code",
                "text-search-ada-query-001",
                "code-search-ada-text-001",
                "babbage-code-search-text",
                "code-search-babbage-code-001",
                "ada-search-query",
                "ada-code-search-text",
                "text-search-curie-query-001",
                "text-davinci-002",
                "text-davinci-edit-001",
                "code-search-babbage-text-001",
                "gpt-3.5-turbo",
                "gpt-3.5-turbo-instruct-0914",
                "ada",
                "text-ada-001",
                "ada-similarity",
                "code-search-ada-code-001",
                "text-similarity-ada-001",
                "gpt-3.5-turbo-0301",
                "gpt-3.5-turbo-instruct",
                "text-search-curie-doc-001",
                "text-davinci-003",
                "text-curie-001",
                "curie",
                "davinci");
        ChatCommand chatCommand = new ChatCommand(gson);
        int counter = 0;
        for (String model : models) {
            JSONObject jsonObject = new JSONObject(String.format("{\"%s\": \"%s\" }", ID, model));
            if (chatCommand.isModelCompatible(jsonObject)) {
                counter += 1;
            }
        }
        // 8 chat-capable gpt models; the two gpt-3.5-turbo-instruct variants are legacy-completions-only
        assertEquals(counter, 8);
    }

    @Test
    public void testModelFilter_currentGenerationModels() {
        ChatCommand chatCommand = new ChatCommand(gson);
        List<String> compatibleModels = List.of(
                "gpt-4o",
                "gpt-4o-mini",
                "gpt-4.1",
                "gpt-5",
                "gpt-5.4-mini",
                "o1",
                "o3",
                "o3-mini",
                "o4-mini",
                "chatgpt-4o-latest",
                "gpt-4o-audio-preview",
                "gpt-4o-search-preview",
                "chat-latest",
                "ft:gpt-4o:acme::abc123",
                // exclusions apply to the base model only, not customer-chosen ft: suffixes
                "ft:gpt-4o:acme-instruct-team::abc123");
        List<String> incompatibleModels = List.of(
                "gpt-4-vision-preview",
                "whisper-1",
                "text-embedding-3-large",
                "omni-moderation-latest",
                "dall-e-3",
                "tts-1",
                // wrong endpoint or Responses-API-only: must not appear in the chat dropdown
                "o3-pro",
                "o3-deep-research",
                "gpt-5-codex",
                "gpt-image-1",
                "gpt-4o-realtime-preview",
                "gpt-4o-mini-tts",
                "gpt-4o-transcribe",
                "gpt-3.5-turbo-instruct");
        for (String model : compatibleModels) {
            JSONObject jsonObject = new JSONObject(String.format("{\"%s\": \"%s\" }", ID, model));
            assertTrue(chatCommand.isModelCompatible(jsonObject), model + " should be listed");
        }
        for (String model : incompatibleModels) {
            JSONObject jsonObject = new JSONObject(String.format("{\"%s\": \"%s\" }", ID, model));
            assertFalse(chatCommand.isModelCompatible(jsonObject), model + " should not be listed");
        }
    }

    @Test
    public void testMakeRequestBody_withoutTemperature_leavesTemperatureUnset() {
        ChatCommand command = new ChatCommand(gson);

        // non-reasoning model, so the blank-value path itself is exercised
        Map<String, Object> formData = new HashMap<>();
        formData.put(CHAT_MODEL_SELECTOR, Map.of(DATA, "gpt-4o"));
        Object messages = List.of(Map.of("role", "user", "content", "Hello"));
        formData.put("messages", Map.of("data", messages));
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);

        ChatRequestDTO request = (ChatRequestDTO) command.makeRequestBody(actionConfiguration);

        assertNull(request.getTemperature());
    }

    @Test
    public void testMakeRequestBody_nonFiniteTemperature_leavesTemperatureUnset() {
        ChatCommand command = new ChatCommand(gson);

        for (String badValue : List.of("NaN", "Infinity", "-Infinity")) {
            Map<String, Object> formData = new HashMap<>();
            formData.put(CHAT_MODEL_SELECTOR, Map.of(DATA, "gpt-4o"));
            formData.put(TEMPERATURE, badValue);
            formData.put("messages", Map.of("data", List.of(Map.of("role", "user", "content", "Hello"))));
            ActionConfiguration actionConfiguration = new ActionConfiguration();
            actionConfiguration.setFormData(formData);

            ChatRequestDTO request = (ChatRequestDTO) command.makeRequestBody(actionConfiguration);

            assertNull(request.getTemperature(), badValue + " must not be sent as temperature");
        }

        // out-of-range finite values pass through so OpenAI can report them explicitly
        Map<String, Object> formData = new HashMap<>();
        formData.put(CHAT_MODEL_SELECTOR, Map.of(DATA, "gpt-4o"));
        formData.put(TEMPERATURE, "2.5");
        formData.put("messages", Map.of("data", List.of(Map.of("role", "user", "content", "Hello"))));
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);

        ChatRequestDTO request = (ChatRequestDTO) command.makeRequestBody(actionConfiguration);

        assertEquals(2.5f, request.getTemperature());
    }

    @Test
    public void testMakeRequestBody_reasoningModels_dropTemperatureEvenWhenFormSendsDefault() {
        ChatCommand command = new ChatCommand(gson);

        // the editor form's temperature field has initialValue "0", so every new query sends it
        for (String reasoningModel : List.of("o3", "o4-mini", "gpt-5", "gpt-5.4-mini", "ft:o4-mini:acme::x")) {
            ChatRequestDTO request = makeRequestWithTemperature(command, reasoningModel, "0");
            assertNull(request.getTemperature(), reasoningModel + " must not receive a temperature");
        }

        // non-reasoning models keep the explicit value, including the form default 0
        assertEquals(0.0f, makeRequestWithTemperature(command, "gpt-4o", "0").getTemperature());
        assertEquals(
                0.3f,
                makeRequestWithTemperature(command, "gpt-5-chat-latest", "0.3").getTemperature());
    }

    private ChatRequestDTO makeRequestWithTemperature(ChatCommand command, String model, String temperature) {
        Map<String, Object> formData = new HashMap<>();
        formData.put(CHAT_MODEL_SELECTOR, Map.of(DATA, model));
        formData.put(TEMPERATURE, temperature);
        formData.put("messages", Map.of("data", List.of(Map.of("role", "user", "content", "Hello"))));
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);
        return (ChatRequestDTO) command.makeRequestBody(actionConfiguration);
    }

    @Test
    public void testSerialization_omitsNullTemperature() throws Exception {
        ChatRequestDTO request = new ChatRequestDTO();
        request.setModel("o3");

        String body = new ObjectMapper().writeValueAsString(request);

        assertFalse(body.contains("temperature"), "null temperature must be omitted from the request body");
    }
}
