package com.external.plugins.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * MssqlAuthenticationSettings reads a value without its key from a fixed slot in
 * {@code datasourceConfiguration.properties}. These tests fail if form.json moves a field to another slot.
 */
public class MssqlFormSlotsTest {

    private static JsonNode form;

    @BeforeAll
    static void readForm() throws Exception {
        try (InputStream in = MssqlFormSlotsTest.class.getResourceAsStream("/form.json")) {
            assertNotNull(in, "form.json is on the classpath");
            form = new ObjectMapper().readTree(in);
        }
    }

    /** Finds the control with this configProperty anywhere in the form. */
    private static JsonNode control(String configProperty) {
        JsonNode found = find(form, configProperty);
        assertNotNull(found, "form.json has " + configProperty);
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
    public void methodSlot_holdsTheMethodKeyAndChoices() {
        int index = MssqlAuthenticationSettings.METHOD_FORM_SLOT;

        assertEquals(
                MssqlAuthenticationSettings.METHOD_KEY,
                control(slot(index, "key")).path("initialValue").asText());

        JsonNode dropdown = control(slot(index, "value"));
        assertEquals(
                MssqlAuthenticationSettings.SQL_SERVER_LOGIN,
                dropdown.path("initialValue").asText());
        Set<String> values = new HashSet<>();
        dropdown.path("options")
                .forEach(option -> values.add(option.path("value").asText()));
        assertEquals(
                Set.of(MssqlAuthenticationSettings.SQL_SERVER_LOGIN, MssqlAuthenticationSettings.KERBEROS), values);
    }

    @Test
    public void serverSpnSlot_holdsTheServerSpnKey() {
        int index = MssqlAuthenticationSettings.SERVER_SPN_FORM_SLOT;

        assertEquals(
                MssqlAuthenticationSettings.SERVER_SPN_KEY,
                control(slot(index, "key")).path("initialValue").asText());
        assertEquals(
                MssqlAuthenticationSettings.KERBEROS,
                control(slot(index, "value")).path("hidden").path("value").asText());
    }
}
