package com.appsmith.server.helpers;

import com.appsmith.server.constants.FieldName;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Slf4j
public class WidgetSpecificUtils {

    private static ObjectMapper objectMapper = new ObjectMapper();
    private static JSONParser jsonParser = new JSONParser(JSONParser.MODE_PERMISSIVE);

    public static JSONObject escapeTableWidgetPrimaryColumns(JSONObject dsl, Set<String> escapedWidgetNames) {
        Set<String> keySet = dsl.keySet();

        if (keySet.contains(FieldName.PRIMARY_COLUMNS)) {
            Map primaryColumns = (Map) dsl.get(FieldName.PRIMARY_COLUMNS);

            Map newPrimaryColumns = new HashMap();

            Boolean updateRequired = false;

            for (String columnName : (Set<String>) primaryColumns.keySet()) {
                if (columnName.equals(FieldName.MONGO_UNESCAPED_ID)) {
                    updateRequired = true;
                    newPrimaryColumns.put(FieldName.MONGO_ESCAPE_ID, primaryColumns.get(columnName));
                } else if (columnName.equals(FieldName.MONGO_UNESCAPED_CLASS)) {
                    updateRequired = true;
                    newPrimaryColumns.put(FieldName.MONGO_ESCAPE_CLASS, primaryColumns.get(columnName));
                } else {
                    newPrimaryColumns.put(columnName, primaryColumns.get(columnName));
                }
            }
            if (updateRequired) {
                dsl.put(FieldName.PRIMARY_COLUMNS, newPrimaryColumns);
                escapedWidgetNames.add(dsl.getAsString(FieldName.WIDGET_NAME));
            }
        }
        return dsl;
    }

    public static JSONObject unEscapeTableWidgetPrimaryColumns(JSONObject dsl) {

        Set<String> keySet = dsl.keySet();

        if (keySet.contains(FieldName.PRIMARY_COLUMNS)) {
            Map primaryColumns = (Map) dsl.get(FieldName.PRIMARY_COLUMNS);

            Map newPrimaryColumns = new HashMap();

            Boolean updateRequired = false;

            for (String columnName : (Set<String>) primaryColumns.keySet()) {
                if (columnName.equals(FieldName.MONGO_ESCAPE_ID)) {
                    updateRequired = true;
                    newPrimaryColumns.put(FieldName.MONGO_UNESCAPED_ID, primaryColumns.get(columnName));
                } else if (columnName.equals(FieldName.MONGO_ESCAPE_CLASS)) {
                    updateRequired = true;
                    newPrimaryColumns.put(FieldName.MONGO_UNESCAPED_CLASS, primaryColumns.get(columnName));
                } else {
                    newPrimaryColumns.put(columnName, primaryColumns.get(columnName));
                }
            }
            if (updateRequired) {
                dsl.put(FieldName.PRIMARY_COLUMNS, newPrimaryColumns);
            }
        }
        return dsl;
    }

    public static JSONObject recursivelyUnescapeDslKeys(JSONObject dsl, Set<String> escapedWidgetNames) {

        String widgetName = (String) dsl.get(FieldName.WIDGET_NAME);

        if (widgetName == null) {
            // This isnt a valid widget configuration. No need to traverse further.
            return dsl;
        }

        if (escapedWidgetNames.contains(widgetName)) {
            // We should escape the widget keys
            String widgetType = dsl.getAsString(FieldName.WIDGET_TYPE);
            if (widgetType.equals(FieldName.TABLE_WIDGET)) {
                // UnEscape Table widget keys
                // Since this is a table widget, it wouldnt have children. We can safely return from here with updated dsl
                return unEscapeTableWidgetPrimaryColumns(dsl);
            }
        }

        // Fetch the children of the current node in the DSL and recursively iterate over them to extract bindings
        ArrayList<Object> children = (ArrayList<Object>) dsl.get(FieldName.CHILDREN);
        ArrayList<Object> newChildren = new ArrayList<>();
        if (children != null) {
            for (int i = 0; i < children.size(); i++) {
                Map data = (Map) children.get(i);
                JSONObject object = new JSONObject();
                // If the children tag exists and there are entries within it
                if (!CollectionUtils.isEmpty(data)) {
                    object.putAll(data);
                    JSONObject child = recursivelyUnescapeDslKeys(object, escapedWidgetNames);
                    newChildren.add(child);
                }
            }
            dsl.put(FieldName.CHILDREN, newChildren);
        }

        return dsl;
    }

}
