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
        flattenHelper(jsonObject, flattenedMap, "");
        return flattenedMap;
    }

    private static void flattenHelper(JSONObject jsonObject, Map<String, JSONObject> flattenedMap, String prefix) {
        try {
            String widgetName = jsonObject.getString("widgetName");
            String widgetType = jsonObject.getString("type");
            boolean isCanvasWidget = "CANVAS_WIDGET".equals(widgetType);

            if (!isCanvasWidget) {
                flattenedMap.put(prefix + widgetName, removeChildren(jsonObject));
            } 

            if (jsonObject.has("children")) {
                JSONArray children = jsonObject.getJSONArray("children");
                for (int i = 0; i < children.length(); i++) {
                    JSONObject child = children.getJSONObject(i);
                    flattenHelper(child, flattenedMap, isCanvasWidget ? prefix : prefix + widgetName + ".");
                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private static JSONObject removeChildren(JSONObject jsonObject) {
        JSONObject updatedObject = new JSONObject(jsonObject.toString());
        updatedObject.remove("children");
        return updatedObject;
    }

    public static JSONObject constructNested(Map<String, JSONObject> flattenedMap) {
        return constructNestedHelper(flattenedMap, "", null);
    }

    private static JSONObject constructNestedHelper(Map<String, JSONObject> flattenedMap, String prefix, JSONObject parent) {
        JSONObject nestedObject = new JSONObject();
        try {
            nestedObject.put("widgetName", prefix);

            if (parent != null) {
                JSONArray childrenArray = new JSONArray();
                childrenArray.put(nestedObject);
                parent.put("children", childrenArray);
            }

            for (Map.Entry<String, JSONObject> entry : flattenedMap.entrySet()) {
                String key = entry.getKey();
                if (key.startsWith(prefix)) {
                    String childKey = key.substring(prefix.length());
                    if (childKey.contains(".")) {
                        String[] nestedKeys = childKey.split("\\.", 2);
                        constructNestedHelper(flattenedMap, prefix + nestedKeys[0] + ".", nestedObject);
                    } else {
                        nestedObject.put(childKey, entry.getValue());
                    }
                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }

        return nestedObject;
    }
}