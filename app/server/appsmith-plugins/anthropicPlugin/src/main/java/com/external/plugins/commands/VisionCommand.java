package com.external.plugins.commands;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.models.AnthropicRequestDTO;
import com.external.plugins.models.Message;
import com.external.plugins.utils.CommandUtils;
import com.external.plugins.utils.RequestUtils;
import com.google.gson.Gson;
import org.springframework.http.HttpMethod;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.AnthropicConstants.ANTHROPIC;
import static com.external.plugins.constants.AnthropicConstants.BASE64;
import static com.external.plugins.constants.AnthropicConstants.CLOUD_SERVICES;
import static com.external.plugins.constants.AnthropicConstants.COMMAND;
import static com.external.plugins.constants.AnthropicConstants.CONTENT;
import static com.external.plugins.constants.AnthropicConstants.IMAGE;
import static com.external.plugins.constants.AnthropicConstants.MESSAGES;
import static com.external.plugins.constants.AnthropicConstants.MODELS_API;
import static com.external.plugins.constants.AnthropicConstants.PROVIDER;
import static com.external.plugins.constants.AnthropicConstants.ROLE;
import static com.external.plugins.constants.AnthropicConstants.SYSTEM_PROMPT;
import static com.external.plugins.constants.AnthropicConstants.TEXT;
import static com.external.plugins.constants.AnthropicConstants.TYPE;
import static com.external.plugins.constants.AnthropicConstants.VISION;
import static com.external.plugins.constants.AnthropicConstants.VISION_MODEL_SELECTOR;
import static com.external.plugins.constants.AnthropicErrorMessages.EXECUTION_FAILURE;
import static com.external.plugins.constants.AnthropicErrorMessages.MODEL_NOT_SELECTED;
import static com.external.plugins.constants.AnthropicErrorMessages.QUERY_NOT_CONFIGURED;
import static com.external.plugins.constants.AnthropicErrorMessages.STRING_APPENDER;
import static com.external.plugins.utils.CommandUtils.getMaxTokenFromFormData;
import static com.external.plugins.utils.CommandUtils.getMessages;
import static com.external.plugins.utils.CommandUtils.getTemperatureFromFormData;

public class VisionCommand implements AnthropicCommand {
    private final Gson gson = new Gson();

    @Override
    public HttpMethod getTriggerHTTPMethod() {
        return HttpMethod.GET;
    }

    @Override
    public HttpMethod getExecutionMethod() {
        return HttpMethod.POST;
    }

    @Override
    public URI createTriggerUri() {
        return UriComponentsBuilder.fromUriString(CLOUD_SERVICES + MODELS_API)
                .queryParam(PROVIDER, ANTHROPIC)
                .queryParam(COMMAND, VISION)
                .build()
                .toUri();
    }

    @Override
    public URI createExecutionUri() {
        return RequestUtils.createUriFromCommand(VISION);
    }

    @Override
    public AnthropicRequestDTO makeRequestBody(ActionConfiguration actionConfiguration) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        if (CollectionUtils.isEmpty(formData)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, QUERY_NOT_CONFIGURED));
        }

        AnthropicRequestDTO anthropicRequestDTO = new AnthropicRequestDTO();
        String model = RequestUtils.extractDataFromFormData(formData, VISION_MODEL_SELECTOR);
        if (!StringUtils.hasText(model)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, MODEL_NOT_SELECTED));
        }
        Float temperature = getTemperatureFromFormData(formData);
        anthropicRequestDTO.setTemperature(temperature);
        anthropicRequestDTO.setModel(model);

        anthropicRequestDTO.setMaxTokens(getMaxTokenFromFormData(formData));
        anthropicRequestDTO.setMessages(createMessages(formData));
        if (formData.containsKey(SYSTEM_PROMPT) && formData.get(SYSTEM_PROMPT) != null) {
            anthropicRequestDTO.setSystem(RequestUtils.extractDataFromFormData(formData, SYSTEM_PROMPT));
        }

        return anthropicRequestDTO;
    }

    private List<Message> createMessages(Map<String, Object> formData) {
        if (!formData.containsKey(MESSAGES)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    "messages are not provided in the configuration");
        }
        List<Map<String, String>> messageMaps = getMessages((Map<String, Object>) formData.get(MESSAGES));
        if (messageMaps == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    "messages are not provided in the configuration correctly");
        }
        List<Message> messages = new ArrayList<>();
        for (Map<String, String> messageMap : messageMaps) {
            if (messageMap != null && messageMap.containsKey(ROLE) && messageMap.containsKey(CONTENT)) {
                Message message = new Message();
                String type = messageMap.get(TYPE);
                message.setRole(CommandUtils.getActualRoleValue(messageMap.get(ROLE)));
                if (TEXT.equals(type)) {
                    Message.TextContent textContent = new Message.TextContent();
                    textContent.setText(messageMap.get(CONTENT));
                    message.setContent(List.of(textContent));
                } else if (IMAGE.equals(type)) {
                    String content = messageMap.get(CONTENT);
                    if (!isValidImageContent(content)) {
                        throw new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                "Image content provided in the configuration is not valid");
                    }
                    Message.ImageContent imageContent = new Message.ImageContent();
                    Message.Source source = new Message.Source();

                    source.setType(BASE64);
                    source.setMediaType(getMediaType(messageMap.get(CONTENT)));
                    source.setData(getImageData(messageMap.get(CONTENT)));

                    imageContent.setSource(source);
                    message.setContent(List.of(imageContent));
                }
                message.setRole(CommandUtils.getActualRoleValue(messageMap.get(ROLE)));
                messages.add(message);
            }
        }
        // As per Anthropic API, two content by same role in row are not allowed. It should be followed like user and
        // assistant
        // That's why we have to club the messages to have user and assistant in alternate order
        List<Message> orderedMessages = new ArrayList<>();
        for (Message message : messages) {
            if (orderedMessages.isEmpty()) {
                orderedMessages.add(message);
            } else {
                Message lastMessage = orderedMessages.get(orderedMessages.size() - 1);
                if (!lastMessage.getRole().equals(message.getRole())) {
                    // different roles so can be added in the order
                    orderedMessages.add(message);
                } else {
                    // add last message content to the current message since both are same role
                    List<Message.Content> content = new ArrayList<>(lastMessage.getContent());
                    content.addAll(message.getContent());
                    message.setContent(content);
                    orderedMessages.remove(lastMessage);
                    orderedMessages.add(message);
                }
            }
        }
        return orderedMessages;
    }

    private boolean isValidImageContent(String content) {
        return StringUtils.hasText(content) && content.startsWith("data:image");
    }

    private String getMediaType(String content) {
        return content.split(";", 2)[0].split(":")[1];
    }

    private String getImageData(String content) {
        return content.split(",", 2)[1];
    }
}
