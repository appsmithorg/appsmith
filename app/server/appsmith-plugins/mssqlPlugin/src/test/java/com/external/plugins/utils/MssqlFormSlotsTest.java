package com.external.plugins.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * MssqlAuthenticationSettings reads a value without its key from a fixed slot in
 * {@code datasourceConfiguration.properties}. These tests fail if form.json moves a field to another slot.
 */
class MssqlFormSlotsTest {

    private static JsonNode form;

    @BeforeAll
    static void readForm() throws Exception {
        try (InputStream in = MssqlFormSlotsTest.class.getResourceAsStream("/form.json")) {
            assertThat(in).as("form.json is on the classpath").isNotNull();
            form = new ObjectMapper().readTree(in);
        }
    }

    /** Finds the control with this configProperty anywhere in the form. */
    private static JsonNode control(String configProperty) {
        JsonNode found = find(form, configProperty);
        assertThat(found).as("form.json has " + configProperty).isNotNull();
        return found;
    }

    private static JsonNode find(JsonNode node, String configProperty) {
        if (node.isObject() && configProperty.equals(node.path("configProperty").asText())) {
            return node;
        }
        for (JsonNode child : node) {
            JsonNode found = find(child, configProperty);
            if (found != null) {
                return found;
            }
        }
        return null;
    }

    private static String slot(int index, String part) {
        return "datasourceConfiguration.properties[" + index + "]." + part;
    }

    @Test
    void should_holdTheTypeKeyAndChoices_when_readingTheTypeSlot() {
        // Given
        int index = MssqlAuthenticationSettings.METHOD_FORM_SLOT;

        // When
        JsonNode key = control(slot(index, "key"));
        JsonNode dropdown = control(slot(index, "value"));

        // Then
        assertThat(key.path("initialValue").asText()).isEqualTo(MssqlAuthenticationSettings.METHOD_KEY);
        assertThat(dropdown.path("initialValue").asText()).isEqualTo(MssqlAuthenticationSettings.SQL_SERVER_LOGIN);
        Set<String> values = new HashSet<>();
        dropdown.path("options")
                .forEach(option -> values.add(option.path("value").asText()));
        assertThat(values)
                .containsExactlyInAnyOrder(
                        MssqlAuthenticationSettings.SQL_SERVER_LOGIN, MssqlAuthenticationSettings.KERBEROS);
    }

    @Test
    void should_holdTheServerSpnKey_when_readingTheServerSpnSlot() {
        // Given
        int index = MssqlAuthenticationSettings.SERVER_SPN_FORM_SLOT;

        // When
        JsonNode key = control(slot(index, "key"));
        JsonNode input = control(slot(index, "value"));

        // Then
        assertThat(key.path("initialValue").asText()).isEqualTo(MssqlAuthenticationSettings.SERVER_SPN_KEY);
        assertThat(input.path("hidden").path("value").asText()).isEqualTo(MssqlAuthenticationSettings.KERBEROS);
    }
}
