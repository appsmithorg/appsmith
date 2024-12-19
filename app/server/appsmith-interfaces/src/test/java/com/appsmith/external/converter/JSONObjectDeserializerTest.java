package com.appsmith.external.converter;

import com.appsmith.external.helpers.JsonForDatabase;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class JSONObjectDeserializerTest {

    private ObjectMapper getObjectMapper() {
        return JsonForDatabase.create();
    }

    public static class Widget {
        public String widgetName;
        public Integer rightColumn;
        public String backgroundColor;
        public Integer snapColumns;
        public Boolean detachFromLayout;
        public String widgetId;
        public Integer topRow;
        public Integer bottomRow;
        public String containerStyle;
        public Integer snapRows;
        public Integer parentRowSpace;
        public String type;
        public Boolean canExtend;
        public Integer version;
        public Integer minHeight;
        public Integer parentColumnSpace;
        public Map<String, Object> children; // Changed type to Map to avoid cast exception
    }

    @Test
    public void testDeserializeWithNullValues() throws IOException {
        // Sample JSON with null values
        String jsonWithNulls = "{\n" + "  \"widgetName\": \"MainContainer\",\n"
                + "  \"rightColumn\": 4896,\n"
                + "  \"backgroundColor\": null,\n"
                + "  \"snapColumns\": 64,\n"
                + "  \"detachFromLayout\": true,\n"
                + "  \"widgetId\": \"0\",\n"
                + "  \"topRow\": 0,\n"
                + "  \"bottomRow\": 680,\n"
                + "  \"containerStyle\": \"none\",\n"
                + "  \"snapRows\": 124,\n"
                + "  \"parentRowSpace\": 1,\n"
                + "  \"type\": \"CANVAS_WIDGET\",\n"
                + "  \"canExtend\": true,\n"
                + "  \"version\": 90,\n"
                + "  \"minHeight\": 1292,\n"
                + "  \"parentColumnSpace\": null\n"
                + "}";

        // Configure ObjectMapper with the custom deserializer
        ObjectMapper objectMapper = getObjectMapper();
        // Register your custom deserializer here if necessary
        // e.g., objectMapper.registerModule(customModule);

        // Deserialize JSON into Widget object
        JSONObjectDeserializerTest.Widget widget =
                objectMapper.readValue(jsonWithNulls, JSONObjectDeserializerTest.Widget.class);

        // Assert deserialized values including null fields
        assertEquals("MainContainer", widget.widgetName);
        assertEquals(4896, widget.rightColumn);
        assertNull(widget.backgroundColor); // Assert null field
        assertEquals(64, widget.snapColumns);
        assertTrue(widget.detachFromLayout);
        assertEquals("0", widget.widgetId);
        assertEquals(0, widget.topRow);
        assertEquals(680, widget.bottomRow);
        assertEquals("none", widget.containerStyle);
        assertEquals(124, widget.snapRows);
        assertEquals(1, widget.parentRowSpace);
        assertEquals("CANVAS_WIDGET", widget.type);
        assertTrue(widget.canExtend);
        assertEquals(90, widget.version);
        assertEquals(1292, widget.minHeight);
        assertNull(widget.parentColumnSpace); // Assert null field
    }
}
