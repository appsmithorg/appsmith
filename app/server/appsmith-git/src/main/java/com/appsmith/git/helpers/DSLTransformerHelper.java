package com.appsmith.git.helpers;

import com.appsmith.git.constants.CommonConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;


@Component
@RequiredArgsConstructor
@Slf4j
public class DSLTransformerHelper {

    public static Map<String, JSONObject> flatten(JSONObject jsonObject) {
        Map<String, JSONObject> flattenedMap = new HashMap<>();
        flattenObject(jsonObject, CommonConstants.EMPTY_STRING, flattenedMap);
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
                String childPrefix = prefix + widgetName + CommonConstants.DELIMITER_POINT;
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

    public static Map<String, List<String>> calculateParentDirectories(List<String> paths) {
        Map<String, List<String>> parentDirectories = new HashMap<>();

        for (String path : paths) {
            String[] directories = path.split("/");
            int lastDirectoryIndex = directories.length - 1;

            if (lastDirectoryIndex > 0 && directories[lastDirectoryIndex].equals(directories[lastDirectoryIndex - 1])) {
                if (lastDirectoryIndex - 2 >= 0) {
                    String parentDirectory = directories[lastDirectoryIndex - 2];
                    List<String> pathsList = parentDirectories.getOrDefault(parentDirectory, new ArrayList<>());
                    pathsList.add(path);
                    parentDirectories.put(parentDirectory, pathsList);
                }
            } else {
                String parentDirectory = directories[lastDirectoryIndex - 1];
                List<String> pathsList = parentDirectories.getOrDefault(parentDirectory, new ArrayList<>());
                pathsList.add(path);
                parentDirectories.put(parentDirectory, pathsList);
            }
        }

        return parentDirectories;
    }

    /*
     * /Form1/Button1.json,
     * /List1/List1.json,
     * /List1/Container1/Text2.json,
     * /List1/Container1/Image1.json,
     * /Form1/Button2.json,
     * /List1/Container1/Text1.json,
     * /Form1/Text3.json,
     * /Form1/Form1.json,
     * /List1/Container1/Container1.json,
     * /MainContainer.json
     * HashMap 1 - ParentName and keyName mapping
     * Loop through the map and create a nested JSON
     */
    public static JSONObject constructNestedJSON(Map<String, JSONObject> jsonMap) {
        // Create the root object
        JSONObject rootObject = new JSONObject();

        // Get the parent object from the map using the special key "MainContainer"
        JSONObject parentObject = jsonMap.get("/MainContainer.json");

        // Construct the nested JSON recursively
        constructNestedJSONHelper(parentObject, jsonMap, rootObject);

        return rootObject;
    }

    private static void constructNestedJSONHelper(JSONObject parentObject, Map<String, JSONObject> jsonMap, JSONObject rootObject) {
        String parentWidgetName = parentObject.optString("widgetName");

        // Create the children array for the parent object
        JSONArray childrenArray = new JSONArray();

        // Find the child objects that have a parent matching the current widget name
        for (Map.Entry<String, JSONObject> entry : jsonMap.entrySet()) {
            String filePath = entry.getKey();
            JSONObject childObject = entry.getValue();

            String relativePath = filePath.substring(0, filePath.lastIndexOf("/"));
            String fileName = filePath.substring(filePath.lastIndexOf("/") + 1);

            if (relativePath.equals(parentWidgetName)) {
                // Add the child object to the children array
                JSONObject modifiedChildObject = new JSONObject(childObject.toString());
                modifiedChildObject.remove("widgetName");
                childrenArray.put(modifiedChildObject);

                // Recursively construct the nested JSON for the child object
                constructNestedJSONHelper(childObject, jsonMap, modifiedChildObject);
            } else if (relativePath.equals(parentWidgetName + "/" + fileName)) {
                // Add the child object to the root object as a direct child
                JSONObject modifiedChildObject = new JSONObject(childObject.toString());
                modifiedChildObject.remove("widgetName");
                rootObject.put(fileName, modifiedChildObject);

                // Recursively construct the nested JSON for the child object
                constructNestedJSONHelper(childObject, jsonMap, modifiedChildObject);
            }
        }

        // Add the children array to the parent object
        if (childrenArray.length() > 0) {
            parentObject.put("children", childrenArray);
        }
    }
}