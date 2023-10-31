package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.commands.ChatCommand;
import com.external.plugins.models.ChatRequestDTO;
import com.external.plugins.models.OpenAIRequestDTO;
import com.google.gson.Gson;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

import static com.external.plugins.constants.OpenAIConstants.CHAT_MODEL_SELECTOR;
import static com.external.plugins.constants.OpenAIConstants.DATA;
import static org.junit.jupiter.api.Assertions.assertEquals;

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
        formData.put(CHAT_MODEL_SELECTOR, Map.of(DATA,"gpt-3.5-turbo"));

        String messages = "[{\"role\": \"user\", \"content\": \"Hello\"}, {\"role\": \"assistant\", \"content\": \"Hi there!\"}]";
        formData.put("messages", messages);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);

        OpenAIRequestDTO request = command.makeRequestBody(actionConfiguration);

        assertEquals("gpt-3.5-turbo", request.getModel());
        assertEquals(2, ((ChatRequestDTO)request).getMessages().size());
    }

}
