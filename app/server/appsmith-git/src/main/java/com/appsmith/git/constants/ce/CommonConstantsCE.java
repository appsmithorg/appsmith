package com.appsmith.git.constants.ce;

public class CommonConstantsCE {
    // This field will be useful when we migrate fields within JSON files (currently this will be useful for Git
    // feature)
    public static Integer fileFormatVersion = 5;
    public static String FILE_FORMAT_VERSION = "fileFormatVersion";
    public static final String SERVER_SCHEMA_VERSION = "serverSchemaVersion";
    public static final String CLIENT_SCHEMA_VERSION = "clientSchemaVersion";

    public static final String CANVAS = "canvas";

    public static final String APPLICATION = "application";
    public static final String THEME = "theme";
    public static final String METADATA = "metadata";
    public static final String JSON_EXTENSION = ".json";
    public static final String JS_EXTENSION = ".js";
    public static final String TEXT_FILE_EXTENSION = ".txt";
    public static final String WIDGETS = "widgets";
    public static final String WIDGET_NAME = "widgetName";
    public static final String WIDGET_TYPE = "type";
    public static final String CHILDREN = "children";

    public static final String CANVAS_WIDGET = "CANVAS_WIDGET";
    public static final String MAIN_CONTAINER = "MainContainer";
    public static final String DELIMITER_POINT = ".";
    public static final String DELIMITER_PATH = "/";
    public static final String DELIMITER_HYPHEN = "-";
    public static final String EMPTY_STRING = "";
    public static final String SEPARATOR_UNDERSCORE = "_";
    public static final String FILE_MIGRATION_MESSAGE =
            "Some of the changes above are due to an improved file structure. You can safely commit them to your repository.";

    public static final String TABS_WIDGET = "TABS_WIDGET";

    public static final String WIDGET_ID = "widgetId";
    public static final String PARENT_ID = "parentId";
}
