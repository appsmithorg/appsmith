package com.appsmith.git.helpers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Component
@RequiredArgsConstructor
@Slf4j
public class DSLTransformerHelper {

    private static final String WIDGET_NAME = "widgetName";

    private static final String WIDGET_ID = "widgetId";

    private static final String PARENT_ID = "parentId";

    private static final String WIDGET_TYPE = "type";

    private static final String CHILDREN = "children";

    public static Map<String, JSONObject> flatten(JSONObject jsonObject) {
        Map<String, JSONObject> flattenedMap = new HashMap<>();
        flattenObject(jsonObject, "", flattenedMap);
        return flattenedMap;
    }

    private static void flattenObject(JSONObject jsonObject, String prefix, Map<String, JSONObject> flattenedMap) {
        String widgetName = jsonObject.optString("widgetName");
        if (widgetName.isEmpty()) {
            return;
        }

        JSONArray children = jsonObject.optJSONArray("children");
        if (children != null) {
            // Check if the children object has type=CANVAS_WIDGET
            String type = jsonObject.optString("type");
            boolean isCanvasWidget = "CANVAS_WIDGET".equals(type);

            if (isCanvasWidget) {
                // Add the current object at the same level as the parent
                jsonObject.remove("children");
                flattenedMap.put(prefix + widgetName, jsonObject);
            } else {
                // Remove the children property if present
                jsonObject.remove("children");
                flattenedMap.put(prefix + widgetName, jsonObject);
            }

            for (int i = 0; i < children.length(); i++) {
                JSONObject childObject = children.getJSONObject(i);
                String childPrefix = prefix + widgetName + ".";
                flattenObject(childObject, childPrefix, flattenedMap);
            }
        } else {
            flattenedMap.put(prefix + widgetName, jsonObject);
        }
    }

    /*
    HashMap 1 - widgetId and WidgetName mapping
    HashMap 2 - parentId and WidgetName mapping
    HashMap 3 - widgetData and WidgetName mapping

    Start with MainContainer.JSON always
    1. Get all the Widgets whose parent id is MainContainer
    2. Call the same function recursively for all the children
    2. Append the widget to the respective parent children array
     */
    private static JSONObject constructNested(Map<String, JSONObject> flattenedMap) {
        JSONObject root = new JSONObject();
        for (Map.Entry<String, JSONObject> entry : flattenedMap.entrySet()) {
            String key = entry.getKey();
            JSONObject value = entry.getValue();
            String[] path = key.split("\\.");

            // Traverse the path to find the parent object
            JSONObject parent = root;
            for (int i = 0; i < path.length - 1; i++) {
                String pathSegment = path[i];
                if (!parent.has(pathSegment)) {
                    parent.put(pathSegment, new JSONObject());
                }
                parent = parent.getJSONObject(pathSegment);
            }

            // Add the current object to its parent
            parent.put(path[path.length - 1], value);
        }
        return root;
    }
}