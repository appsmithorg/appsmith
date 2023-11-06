package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.commands.ChatCommand;
import com.external.plugins.models.ChatRequestDTO;
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
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

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
        formData.put("messages", messages);
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
        assertEquals(counter, 10);
    }
}
