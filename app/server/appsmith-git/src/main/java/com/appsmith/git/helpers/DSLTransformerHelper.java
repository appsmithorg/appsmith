package com.appsmith.git.helpers;

import com.appsmith.git.constants.CommonConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;


@Component
@RequiredArgsConstructor
@Slf4j
public class DSLTransformerHelper {

    public static Map<String, JSONObject> flatten(JSONObject jsonObject) {
        Map<String, JSONObject> flattenedMap = new HashMap<>();
        flattenObject(jsonObject, "", flattenedMap);
        return new TreeMap<>(flattenedMap);
    }

    private static void flattenObject(JSONObject jsonObject, String prefix, Map<String, JSONObject> flattenedMap) {
        String widgetName = jsonObject.optString(CommonConstants.WIDGET_NAME);
        if (widgetName.isEmpty()) {
            return;
        }

        JSONArray children = jsonObject.optJSONArray(CommonConstants.CHILDREN);
        if (children != null) {
            // Check if the children object has type=CANVAS_WIDGET
            jsonObject = removeChildrenIfNotCanvasWidget(jsonObject);
            flattenedMap.put(prefix + widgetName, jsonObject);

            for (int i = 0; i < children.length(); i++) {
                JSONObject childObject = children.getJSONObject(i);
                String childPrefix = prefix + widgetName + ".";
                flattenObject(childObject, childPrefix, flattenedMap);
            }
        } else {
            flattenedMap.put(prefix + widgetName, jsonObject);
        }
    }

    private static JSONObject removeChildrenIfNotCanvasWidget(JSONObject jsonObject) {
        JSONArray children = jsonObject.optJSONArray(CommonConstants.CHILDREN);
        if (children.length() == 1) {
            JSONObject child = children.getJSONObject(0);
            if (!CommonConstants.CANVAS_WIDGET.equals(child.optString(CommonConstants.WIDGET_TYPE))) {
                jsonObject.remove(CommonConstants.CHILDREN);
            } else {
                JSONObject childCopy = new JSONObject(child.toString());
                childCopy.remove(CommonConstants.CHILDREN);
                JSONArray jsonArray = new JSONArray();
                jsonArray.put(childCopy);
                jsonObject.put(CommonConstants.CHILDREN, jsonArray);
            }
        } else {
            jsonObject.remove(CommonConstants.CHILDREN);
        }
        return jsonObject;
    }

    public static boolean hasChildren(JSONObject jsonObject) {
        JSONArray children = jsonObject.optJSONArray(CommonConstants.CHILDREN);
        return children != null && children.length() > 0;
    }

    /*
    HashMap 1 - widgetId and WidgetName mapping
    HashMap 2 - parentId and WidgetName mapping
    HashMap 3 - widgetData and WidgetName mapping

    Start with MainContainer.JSON always
    1. Get all the Widgets whose parent id is MainContainer
    2. Call the same function recursively for all the children
    3. Append the widget to the respective parent children array
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