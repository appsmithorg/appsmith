package com.appsmith.git.helpers;

import com.appsmith.git.constants.CommonConstants;
import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

public class DSLTransformerHelperTest {

    private Map<String, JSONObject> jsonMap;
    private Map<String, List<String>> pathMapping;

    @BeforeEach
    public void setup() {
        // Initialize the JSON map and path mapping for each test
        jsonMap = new HashMap<>();
        pathMapping = new HashMap<>();
    }

    private String getWidgetDSL(String fileName) {
        ClassLoader classLoader = getClass().getClassLoader();
        File file = new File(classLoader.getResource("DSLWidget/" + fileName).getFile());
        String data = CommonConstants.EMPTY_STRING;
        try {
            data = FileUtils.readFileToString(file, "UTF-8");
        } catch (IOException ignored) {
        }
        return data;
    }

    @Test
    public void testHasChildren_WithChildren() {
        JSONObject jsonObject = new JSONObject();
        JSONArray children = new JSONArray();
        children.put(new JSONObject());
        jsonObject.put(CommonConstants.CHILDREN, children);

        boolean result = DSLTransformerHelper.hasChildren(jsonObject);

        Assertions.assertTrue(result);
    }

    @Test
    public void testHasChildren_WithoutChildren() {
        JSONObject jsonObject = new JSONObject();

        boolean result = DSLTransformerHelper.hasChildren(jsonObject);

        Assertions.assertFalse(result);
    }

    @Test
    public void testIsCanvasWidget_WithCanvasWidget() {
        JSONObject widgetObject = new JSONObject();
        widgetObject.put(CommonConstants.WIDGET_TYPE, "CANVAS_WIDGET_1");
        boolean result = DSLTransformerHelper.isCanvasWidget(widgetObject);
        Assertions.assertTrue(result);
    }

    @Test
    public void testIsCanvasWidget_WithNonCanvasWidget() {
        JSONObject widgetObject = new JSONObject();
        widgetObject.put("widgetType", "BUTTON_WIDGET");

        boolean result = DSLTransformerHelper.isCanvasWidget(widgetObject);

        Assertions.assertFalse(result);
    }

    @Test
    public void testIsCanvasWidget_WithMissingWidgetType() {
        JSONObject widgetObject = new JSONObject();

        boolean result = DSLTransformerHelper.isCanvasWidget(widgetObject);

        Assertions.assertFalse(result);
    }

    @Test
    public void testCalculateParentDirectories() {
        // Test Case 1: Simple paths
        List<String> paths1 =
                Arrays.asList("/root/dir1/file1", "/root/dir1/file2", "/root/dir2/file3", "/root/dir3/file4");
        Map<String, List<String>> result1 = DSLTransformerHelper.calculateParentDirectories(paths1);
        Map<String, List<String>> expected1 = new HashMap<>();
        expected1.put("dir1", Arrays.asList("/root/dir1/file1", "/root/dir1/file2"));
        expected1.put("dir2", Arrays.asList("/root/dir2/file3"));
        expected1.put("dir3", Arrays.asList("/root/dir3/file4"));
        Assertions.assertEquals(expected1, result1);

        // Test Case 2: Paths with duplicate directories
        List<String> paths2 =
                Arrays.asList("/root/dir1/file1", "/root/dir1/file2", "/root/dir2/file3", "/root/dir1/file4");
        Map<String, List<String>> result2 = DSLTransformerHelper.calculateParentDirectories(paths2);
        Map<String, List<String>> expected2 = new HashMap<>();
        expected2.put("dir1", Arrays.asList("/root/dir1/file1", "/root/dir1/file2", "/root/dir1/file4"));
        expected2.put("dir2", Arrays.asList("/root/dir2/file3"));
        Assertions.assertEquals(expected2, result2);

        // Test Case 3: Paths with empty list
        List<String> paths3 = Collections.emptyList();
        Map<String, List<String>> result3 = DSLTransformerHelper.calculateParentDirectories(paths3);
        Map<String, List<String>> expected3 = Collections.emptyMap();
        Assertions.assertEquals(expected3, result3);

        // Test Case 4: Paths with single-level directories
        List<String> paths4 = Arrays.asList("/dir1/file1", "/dir2/file2", "/dir3/file3");
        Map<String, List<String>> result4 = DSLTransformerHelper.calculateParentDirectories(paths4);
        Map<String, List<String>> expected4 = new HashMap<>();
        expected4.put("dir1", Arrays.asList("/dir1/file1"));
        expected4.put("dir2", Arrays.asList("/dir2/file2"));
        expected4.put("dir3", Arrays.asList("/dir3/file3"));
        Assertions.assertEquals(expected4, result4);
    }

    // Test case for nested JSON object construction
    // --------------------------------------------------------------------
    @Test
    public void testGetNestedDSL_EmptyPageWithNoWidgets() {
        JSONObject mainContainer = new JSONObject();

        JSONObject result = DSLTransformerHelper.getNestedDSL(jsonMap, pathMapping, mainContainer);

        Assertions.assertEquals(mainContainer, result);
    }

    @Test
    public void testGetChildren_WithNoChildren() {
        JSONObject widgetObject = new JSONObject();
        widgetObject.put("type", "CANVAS_WIDGET");
        widgetObject.put("id", "widget1");
        jsonMap.put("widget1.json", widgetObject);

        List<String> pathList = new ArrayList<>();
        pathMapping.put("widget1", pathList);

        JSONObject result = DSLTransformerHelper.getChildren("widget1", jsonMap, pathMapping);

        Assertions.assertEquals(widgetObject, result);
    }

    @Test
    public void testGetChildren_WithNestedChildren() {
        JSONObject widgetObject = new JSONObject();
        widgetObject.put(CommonConstants.WIDGET_TYPE, "CANVAS_WIDGET");
        widgetObject.put("id", "widget1");
        jsonMap.put("widget1.json", widgetObject);

        JSONObject childObject = new JSONObject();
        childObject.put(CommonConstants.WIDGET_TYPE, "BUTTON_WIDGET");
        childObject.put("id", "widget2");
        jsonMap.put("widget2.json", childObject);

        List<String> pathList = new ArrayList<>();
        pathList.add("widget2");
        pathMapping.put("widget1", pathList);

        JSONObject result = DSLTransformerHelper.getChildren("widget1", jsonMap, pathMapping);

        Assertions.assertEquals(widgetObject, result);
        JSONArray children = result.optJSONArray(CommonConstants.CHILDREN);
        Assertions.assertNotNull(children);
        Assertions.assertEquals(1, children.length());
        JSONObject child = children.getJSONObject(0);
        Assertions.assertEquals(childObject, child);
        JSONArray childChildren = child.optJSONArray(CommonConstants.CHILDREN);
        Assertions.assertNull(childChildren);
    }

    @Test
    public void testGetWidgetName_WithSingleDirectory() {
        String path = "widgets/parent/child";

        String result = DSLTransformerHelper.getWidgetName(path);

        Assertions.assertEquals("child", result);
    }

    @Test
    public void testGetWidgetName_WithMultipleDirectories() {
        String path = "widgets/parent/child/grandchild";

        String result = DSLTransformerHelper.getWidgetName(path);

        Assertions.assertEquals("grandchild", result);
    }

    @Test
    public void testGetWidgetName_WithEmptyPath() {
        String path = "";

        String result = DSLTransformerHelper.getWidgetName(path);

        Assertions.assertEquals("", result);
    }

    @Test
    public void testGetWidgetName_WithRootDirectory() {
        String path = "widgets";

        String result = DSLTransformerHelper.getWidgetName(path);

        Assertions.assertEquals("widgets", result);
    }

    @Test
    public void testAppendChildren_WithNoExistingChildren() {
        JSONObject parent = new JSONObject();
        JSONArray childWidgets = new JSONArray()
                .put(new JSONObject().put(CommonConstants.WIDGET_NAME, "Child1"))
                .put(new JSONObject().put(CommonConstants.WIDGET_NAME, "Child2"));

        JSONObject result = DSLTransformerHelper.appendChildren(parent, childWidgets);

        JSONArray expectedChildren = new JSONArray()
                .put(new JSONObject().put(CommonConstants.WIDGET_NAME, "Child1"))
                .put(new JSONObject().put(CommonConstants.WIDGET_NAME, "Child2"));

        Assertions.assertEquals(
                expectedChildren.toString(),
                result.optJSONArray(CommonConstants.CHILDREN).toString());
    }

    @Test
    public void testAppendChildren_WithExistingMultipleChildren() {
        JSONObject parent = new JSONObject();
        JSONArray existingChildren = new JSONArray()
                .put(new JSONObject()
                        .put(CommonConstants.WIDGET_NAME, "ExistingChild1")
                        .put(CommonConstants.WIDGET_ID, "ExistingChild1"))
                .put(new JSONObject()
                        .put(CommonConstants.WIDGET_NAME, "ExistingChild2")
                        .put(CommonConstants.WIDGET_ID, "ExistingChild2"));
        parent.put(CommonConstants.CHILDREN, existingChildren);
        JSONArray childWidgets = new JSONArray()
                .put(new JSONObject()
                        .put(CommonConstants.WIDGET_NAME, "Child1")
                        .put(CommonConstants.PARENT_ID, "ExistingChild1"))
                .put(new JSONObject()
                        .put(CommonConstants.WIDGET_NAME, "Child2")
                        .put(CommonConstants.PARENT_ID, "ExistingChild2"));

        JSONObject result = DSLTransformerHelper.appendChildren(parent, childWidgets);

        JSONArray actualChildren = result.optJSONArray(CommonConstants.CHILDREN);

        Assertions.assertEquals(actualChildren.length(), 2);
        Assertions.assertEquals(
                actualChildren
                        .getJSONObject(0)
                        .optJSONArray(CommonConstants.CHILDREN)
                        .getJSONObject(0)
                        .toString(),
                new JSONObject()
                        .put(CommonConstants.WIDGET_NAME, "Child1")
                        .put(CommonConstants.PARENT_ID, "ExistingChild1")
                        .toString());
    }

    @Test
    public void compareWidgetsWithDSL() {
        String dsl = getWidgetDSL("AllWidgetsDSL.json");
        Map<String, JSONObject> flattenedWidgets = DSLTransformerHelper.flatten(new JSONObject(dsl));

        // 62 because some of the widgets are nested inside List Modal etc
        Assertions.assertEquals(flattenedWidgets.size(), 62);
    }

    @Test
    public void tabWidget_withNestedChildren_AllWidgetsAreParsed() {
        String dsl = getWidgetDSL("TabWidgetNestedChildren.json");
        Map<String, JSONObject> flattenedWidgets = DSLTransformerHelper.flatten(new JSONObject(dsl));

        for (Map.Entry<String, JSONObject> entry : flattenedWidgets.entrySet()) {
            JSONObject widget = entry.getValue();
            String relativePath = entry.getKey();
            assertThat(relativePath.contains("Tabs1")).isTrue();
            if (widget.getString(CommonConstants.WIDGET_NAME).equals("Button1")) {
                assertThat(relativePath.endsWith("Button1")).isTrue();
            } else if (widget.getString(CommonConstants.WIDGET_NAME).equals("CurrencyInput1")) {
                assertThat(relativePath.endsWith("CurrencyInput1")).isTrue();
            }
        }
    }

    @Test
    void testGetPathToWidgetFile_whenChildWidgetIsSubstringOfParent_returnsParentWidgetPath() {

        JSONObject jsonObject = new JSONObject(Map.of("widgetName", "bar"));
        String pathToWidgetFile = DSLTransformerHelper.getPathToWidgetFile("foobar.bar", jsonObject, "bar");

        org.assertj.core.api.Assertions.assertThat(pathToWidgetFile).isEqualTo("foobar/");
    }
}
