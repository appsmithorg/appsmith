package com.appsmith.git.helpers;

import com.appsmith.git.constants.CommonConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import static com.appsmith.git.constants.CommonConstants.CANVAS_WIDGET;

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
            removeChildrenIfNotCanvasWidget(jsonObject);
            if (!isCanvasWidget(jsonObject)) {
                flattenedMap.put(prefix + widgetName, jsonObject);
            }

            for (int i = 0; i < children.length(); i++) {
                JSONObject childObject = children.getJSONObject(i);
                String childPrefix =
                        isCanvasWidget(childObject) ? prefix + widgetName + CommonConstants.DELIMITER_POINT : prefix;
                String widgetType = getWidgetType(jsonObject);
                flattenObject(childObject, childPrefix, flattenedMap);
            }
        } else {
            if (!isCanvasWidget(jsonObject)) {
                flattenedMap.put(prefix + widgetName, jsonObject);
            }
        }
    }

    private static JSONObject removeChildrenIfNotCanvasWidget(JSONObject jsonObject) {
        JSONArray children = jsonObject.optJSONArray(CommonConstants.CHILDREN);
        JSONArray jsonArray = new JSONArray();
        if (children.length() != 0) {
            for (int i = 0; i < children.length(); i++) {
                JSONObject child = children.getJSONObject(i);
                if (!CANVAS_WIDGET.equals(child.optString(CommonConstants.WIDGET_TYPE))) {
                    jsonObject.remove(CommonConstants.CHILDREN);
                } else {
                    JSONObject childCopy = new JSONObject(child.toString());
                    childCopy.remove(CommonConstants.CHILDREN);
                    jsonArray.put(childCopy);
                }
            }
            // For tabs Widget, we need to add the children back to the JSON object
            if (jsonArray.length() != 0) {
                jsonObject.put(CommonConstants.CHILDREN, jsonArray);
            }
        }
        return jsonObject;
    }

    public static boolean hasChildren(JSONObject jsonObject) {
        JSONArray children = jsonObject.optJSONArray(CommonConstants.CHILDREN);
        return children != null && children.length() > 0;
    }

    public static String getWidgetType(JSONObject jsonObject) {
        return jsonObject.optString(CommonConstants.WIDGET_TYPE);
    }

    public static boolean isTabsWidget(JSONObject jsonObject) {
        return jsonObject.optString(CommonConstants.WIDGET_TYPE).startsWith(CommonConstants.TABS_WIDGET);
    }

    public static boolean isTabs(JSONObject jsonObject) {
        return StringUtils.isEmpty(jsonObject.optString(CommonConstants.WIDGET_TYPE));
    }

    public static boolean isCanvasWidget(JSONObject jsonObject) {
        return jsonObject.optString(CommonConstants.WIDGET_TYPE).startsWith(CANVAS_WIDGET);
    }

    public static Map<String, List<String>> calculateParentDirectories(List<String> paths) {
        Map<String, List<String>> parentDirectories = new HashMap<>();

        paths = paths.stream()
                .map(currentPath -> currentPath.replace(CommonConstants.JSON_EXTENSION, CommonConstants.EMPTY_STRING))
                .collect(Collectors.toList());
        for (String path : paths) {
            String[] directories = path.split(CommonConstants.DELIMITER_PATH);
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
     */
    public static JSONObject getNestedDSL(
            Map<String, JSONObject> jsonMap, Map<String, List<String>> pathMapping, JSONObject mainContainer) {
        // start from the root
        // Empty page with no widgets
        if (!pathMapping.containsKey(CommonConstants.MAIN_CONTAINER)) {
            return mainContainer;
        }
        for (String path : pathMapping.get(CommonConstants.MAIN_CONTAINER)) {
            JSONObject child = getChildren(path, jsonMap, pathMapping);
            JSONArray children = mainContainer.optJSONArray(CommonConstants.CHILDREN);
            if (children == null) {
                children = new JSONArray();
                children.put(child);
                mainContainer.put(CommonConstants.CHILDREN, children);
            } else {
                children.put(child);
            }
        }
        return mainContainer;
    }

    public static JSONObject getChildren(
            String pathToWidget, Map<String, JSONObject> jsonMap, Map<String, List<String>> pathMapping) {
        // Recursively get the children
        List<String> children = pathMapping.get(getWidgetName(pathToWidget));
        JSONObject parentObject = jsonMap.get(pathToWidget + CommonConstants.JSON_EXTENSION);
        if (children != null) {
            JSONArray childArray = new JSONArray();
            for (String childWidget : children) {
                childArray.put(getChildren(childWidget, jsonMap, pathMapping));
            }
            // Check if the parent object has type=CANVAS_WIDGET as children
            // If yes, then add the children array to the CANVAS_WIDGET's children
            appendChildren(parentObject, childArray);
        }

        return parentObject;
    }

    public static String getWidgetName(String path) {
        String[] directories = path.split(CommonConstants.DELIMITER_PATH);
        return directories[directories.length - 1];
    }

    public static JSONObject appendChildren(JSONObject parent, JSONArray childWidgets) {
        JSONArray children = parent.optJSONArray(CommonConstants.CHILDREN);
        if (children == null) {
            parent.put(CommonConstants.CHILDREN, childWidgets);
        } else {
            // Is the children CANVAS_WIDGET
            if (children.length() == 1) {
                JSONObject childObject = children.getJSONObject(0);
                if (CANVAS_WIDGET.equals(childObject.optString(CommonConstants.WIDGET_TYPE))) {
                    childObject.put(CommonConstants.CHILDREN, childWidgets);
                }
            } else if (children.length() > 1) { // Tabs Widget children mapping case
                // Loop through every single child of Individual Tabs
                // ParentId Mapping to find the parent child in the tabs
                JSONArray existingChildren = parent.optJSONArray(CommonConstants.CHILDREN);
                Map<String, JSONObject> widgetIdWidgetNameMapping = getWidgetIdWidgetNameMapping(existingChildren);
                for (int i = 0; i < childWidgets.length(); i++) {
                    JSONObject childWidget = childWidgets.getJSONObject(i);
                    String parentId = childWidget.optString(CommonConstants.PARENT_ID);
                    JSONObject parentObject = widgetIdWidgetNameMapping.get(parentId);
                    JSONArray existingChildChildren = parentObject.optJSONArray(CommonConstants.CHILDREN);
                    if (existingChildChildren == null) {
                        existingChildChildren = new JSONArray();
                    }
                    existingChildChildren.put(childWidget);
                    parentObject.put(CommonConstants.CHILDREN, existingChildChildren);
                }

            } else {
                parent.put(CommonConstants.CHILDREN, childWidgets);
            }
        }
        return parent;
    }

    private static Map<String, JSONObject> getWidgetIdWidgetNameMapping(JSONArray existingChildren) {
        Map<String, JSONObject> widgetIdWidgetNameMapping = new HashMap<>();
        for (int i = 0; i < existingChildren.length(); i++) {
            JSONObject existingChild = existingChildren.getJSONObject(i);
            widgetIdWidgetNameMapping.put(existingChild.optString(CommonConstants.WIDGET_ID), existingChild);
        }
        return widgetIdWidgetNameMapping;
    }

    public static String getPathToWidgetFile(String key, JSONObject jsonObject, String widgetName) {
        // get path with splitting the name via key
        String childPath = key.replace(CommonConstants.MAIN_CONTAINER, CommonConstants.EMPTY_STRING)
                .replace(CommonConstants.DELIMITER_POINT, CommonConstants.DELIMITER_PATH);
        // Replace the canvas Widget as a child and add it to the same level as parent
        childPath = childPath.replaceAll(CANVAS_WIDGET, CommonConstants.EMPTY_STRING);
        if (!DSLTransformerHelper.hasChildren(jsonObject) && !DSLTransformerHelper.isTabsWidget(jsonObject)) {
            // Save the widget as a directory or Save the widget as a file
            // Only consider widgetName at the end of the childPath to reset
            // For example, "foobar/bar" should convert into "foobar/"
            childPath = childPath.replaceAll(widgetName + "$", CommonConstants.EMPTY_STRING);
        }

        return childPath;
    }
}
