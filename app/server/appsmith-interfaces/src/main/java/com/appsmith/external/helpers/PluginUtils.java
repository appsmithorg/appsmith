package com.appsmith.external.helpers;

import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class PluginUtils {

    public static List<String> getColumnsListForJdbcPlugin(ResultSetMetaData metaData) throws SQLException {
        List<String> columnsList = IntStream
                .range(1, metaData.getColumnCount()+1) // JDBC column indexes start from 1
                .mapToObj(i -> {
                    try {
                        return metaData.getColumnName(i);
                    } catch (SQLException exception) {
                        /*
                         * - Need suggestions on alternative ways of handling this exception.
                         */
                        throw new RuntimeException(exception);
                    }
                })
                .collect(Collectors.toList());

        return columnsList;
    }

    public static List<String> getIdenticalColumns(List<String> columnNames) {
        /*
         * - Get frequency of each column name
         */
        Map<String, Long> columnFrequencies = columnNames
                .stream()
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        /*
         * - Filter only the inputs which have frequency greater than 1
         */
        List<String> identicalColumns = columnFrequencies.entrySet().stream()
                .filter(entry -> entry.getValue() > 1)
                .map(entry -> entry.getKey())
                .collect(Collectors.toList());

        return identicalColumns;
    }

    public static String getActionConfigurationPropertyPath(int index) {
        return "actionConfiguration.pluginSpecifiedTemplates[" + index + "].value";
    }

    public static String getPSParamLabel(int i) {
        return "$" + i;
    }
}
