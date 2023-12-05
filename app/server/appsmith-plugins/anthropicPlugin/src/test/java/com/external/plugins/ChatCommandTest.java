package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.commands.ChatCommand;
import com.external.plugins.models.AnthropicRequestDTO;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.AnthropicConstants.CHAT_MODEL_SELECTOR;
import static com.external.plugins.constants.AnthropicConstants.DATA;
import static com.external.plugins.constants.AnthropicConstants.DEFAULT_MAX_TOKEN;
import static com.external.plugins.constants.AnthropicConstants.DEFAULT_TEMPERATURE;
import static com.external.plugins.constants.AnthropicConstants.TEST_MODEL;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class ChatCommandTest {

    @Test
    public void testCreateTriggerUri() {
        ChatCommand command = new ChatCommand();
        URI uri = command.createTriggerUri();
        assertEquals("/api/v1/ai/models", uri.getPath());
    }

    @Test
    public void testCreateExecutionUri() {
        ChatCommand command = new ChatCommand();
        URI uri = command.createExecutionUri();

        assertEquals("/v1/complete", uri.getPath());
    }

    @Test
    public void testMakeRequestBody_withValidData() {
        // Test with valid form data

        ChatCommand command = new ChatCommand();

        Map<String, Object> formData = new HashMap<>();
        formData.put(CHAT_MODEL_SELECTOR, Map.of(DATA, TEST_MODEL));

        Object messages =
                List.of(Map.of("role", "Human", "content", "Hey"), Map.of("role", "Assistant", "content", "Hi there!"));
        formData.put("messages", Map.of(DATA, messages));
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);

        AnthropicRequestDTO request = command.makeRequestBody(actionConfiguration);

        assertEquals(TEST_MODEL, request.getModel());
        assertNotNull(request.getPrompt());
        assertEquals(DEFAULT_TEMPERATURE, request.getTemperature());
        assertEquals(DEFAULT_MAX_TOKEN, request.getMaxTokensToSample());
        assertEquals("\n\nHuman: Hey\n\nAssistant: Hi there!\nAssistant:", request.getPrompt());
    }
}
