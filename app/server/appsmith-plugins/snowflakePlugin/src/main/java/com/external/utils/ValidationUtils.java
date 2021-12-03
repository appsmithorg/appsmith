package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import org.springframework.util.StringUtils;

import java.sql.Connection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.external.utils.ExecutionUtils.getRowsFromQueryResult;

public class ValidationUtils {

    private static String CURRENT_WAREHOUSE_QUERY = "select current_warehouse() as Warehouse";
    private static String CURRENT_DATABASE_QUERY = "select current_database() as Database";
    private static String CURRENT_SCHEMA_QUERY = "select current_schema() as Schema";
    private static String WAREHOUSE_KEY = "WAREHOUSE";
    private static String DATABASE_KEY = "DATABASE";
    private static String SCHEMA_KEY = "SCHEMA";

    /**
     * Run a query to get the current warehouse, database and schema name. If invalid names were provided when
     * creating the connection object, then this query returns null / empty value against the corresponding
     * column - i.e. warehouse / database / schema.
     *
     * @param connection - Connection object to execute query
     * @return A set of error statements in case the query result contains any null / empty value.
     */
    public static Set<String> validateWarehouseDatabaseSchema(Connection connection) throws StaleConnectionException,
            AppsmithPluginException {
        Set<String> invalids = new HashSet<>();

        // Check database validity.
        List<Map<String, Object>> rowsList = getRowsFromQueryResult(connection, CURRENT_DATABASE_QUERY);
        if (StringUtils.isEmpty(rowsList.get(0).get(DATABASE_KEY))) {
            invalids.add(getWarehouseDatabaseSchemaErrorMessage(DATABASE_KEY));
            return invalids;
        }

        // Check warehouse validity.
        rowsList = getRowsFromQueryResult(connection, CURRENT_WAREHOUSE_QUERY);
        if (StringUtils.isEmpty(rowsList.get(0).get(WAREHOUSE_KEY))) {
            invalids.add(getWarehouseDatabaseSchemaErrorMessage(WAREHOUSE_KEY));
            return invalids;
        }

        // Check schema validity.
        rowsList = getRowsFromQueryResult(connection, CURRENT_SCHEMA_QUERY);
        if (StringUtils.isEmpty(rowsList.get(0).get(SCHEMA_KEY))) {
            invalids.add(getWarehouseDatabaseSchemaErrorMessage(SCHEMA_KEY));
            return invalids;
        }

        return invalids;
    }

    // Construct error message string.
    private static String getWarehouseDatabaseSchemaErrorMessage(String key) {
        String fieldName = StringUtils.capitalize(key.toLowerCase());
        return "Appsmith could not find any valid " + key.toLowerCase() + " configured for this datasource. " +
                "Please provide a valid " + key.toLowerCase() + " by editing the " + fieldName + " field in the " +
                "datasource configuration page.";
    }
}
