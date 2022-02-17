package com.external.utils;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.constants.ConditionalOperator;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.firestore.FieldPath;
import com.google.cloud.firestore.Query;
import org.apache.commons.lang3.StringUtils;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;

public class WhereConditionUtils {

    protected static final ObjectMapper objectMapper = new ObjectMapper();

    public static Query applyWhereConditional(Query query, String strPath, String operatorString, String strValue) throws AppsmithPluginException {

        String path = strPath.trim();

        if (query == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Appsmith server has found null query object when applying where conditional on Firestore " +
                            "query. Please contact Appsmith's customer support to resolve this."
            );
        }

        ConditionalOperator operator;
        try {
            operator = StringUtils.isEmpty(operatorString) ? null : ConditionalOperator.valueOf(operatorString);
        } catch (IllegalArgumentException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Appsmith server has encountered an invalid operator for Firestore query's where conditional." +
                            " Please contact Appsmith's customer support to resolve this."
            );
        }

        DataType dataType = DataTypeStringUtils.stringToKnownDataTypeConverter(strValue);
        Object value = strValue.trim();

        switch (dataType) {
            case INTEGER:
            case LONG:
            case FLOAT:
            case DOUBLE:
                value = Double.parseDouble(strValue);
                break;

            case BOOLEAN:
                value = Boolean.parseBoolean(strValue);
                break;

            case DATE:
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
                java.util.Date date = null;
                try {
                    date = sdf.parse(strValue);
                } catch (ParseException e) {
                    //Input may not be of above pattern
                }
                value = date;
                break;

            case TIMESTAMP:
                SimpleDateFormat sdfTs = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                java.util.Date timeStamp = null;
                try {
                    timeStamp = sdfTs.parse(strValue);
                } catch (ParseException e) {
                    //Input may not be of above pattern
                }
                value = timeStamp;
                break;
        }

        FieldPath fieldPath = FieldPath.of(path.split("\\."));
        switch (operator) {
            case LT:
                return query.whereLessThan(fieldPath, value);
            case LTE:
                return query.whereLessThanOrEqualTo(fieldPath, value);
            case EQ:
                return query.whereEqualTo(fieldPath, value);
            // TODO: NOT_EQ operator support is awaited in the next version of Firestore driver.
            // case NOT_EQ:
            //     return Mono.just(query.whereNotEqualTo(path, value));
            case GT:
                return query.whereGreaterThan(fieldPath, value);
            case GTE:
                return query.whereGreaterThanOrEqualTo(fieldPath, value);
            case ARRAY_CONTAINS:
                return query.whereArrayContains(fieldPath, value);
            case ARRAY_CONTAINS_ANY:
                try {
                    return query.whereArrayContainsAny(fieldPath, parseList((String) value));
                } catch (IOException e) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "Unable to parse condition value as a JSON list."
                    );
                }
            case IN:
                try {
                    return query.whereIn(fieldPath, parseList((String) value));
                } catch (IOException e) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "Unable to parse condition value as a JSON list."
                    );
                }
                // TODO: NOT_IN operator support is awaited in the next version of Firestore driver.
                // case NOT_IN:
                //     return Mono.just(query.whereNotIn(fieldPath, value));
            default:
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Appsmith server has encountered an invalid operator for Firestore query's where conditional." +
                                " Please contact Appsmith's customer support to resolve this."
                );
        }
    }

    private static <T> List<T> parseList(String arrayJson) throws IOException {
        return (List<T>) objectMapper.readValue(arrayJson, ArrayList.class);
    }
}
