package com.appsmith.external.helpers;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ConditionalOperator;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;

import java.math.BigDecimal;

@Slf4j
public class DataUtils {
    private static JSONParser parser = new JSONParser(JSONParser.MODE_PERMISSIVE);


    public static Boolean compareNumbers(String source, String destination, ConditionalOperator operator) {
        Number sourceNumber = new BigDecimal(source);
        Integer compare = null;
        try {
            Number destinationNumber = new BigDecimal(destination);

            // Returns:
            //-1, 0, or 1 as this BigDecimal is numerically less than, equal to, or greater than val.
            compare = NumberComparator.compare(sourceNumber, destinationNumber);
        } catch (NumberFormatException e) {
            // In case the destination is an array, this exception is expected. Move on
        }

        switch (operator) {
            case LT:
                return compare < 0 ? Boolean.TRUE : Boolean.FALSE;
            case LTE:
                return compare <= 0 ? Boolean.TRUE : Boolean.FALSE;
            case EQ:
                return compare == 0 ? Boolean.TRUE : Boolean.FALSE;
            case NOT_EQ:
                return compare != 0 ? Boolean.TRUE : Boolean.FALSE;
            case GT:
                return compare > 0 ? Boolean.TRUE : Boolean.FALSE;
            case GTE:
                return compare >= 0 ? Boolean.TRUE : Boolean.FALSE;
            case ARRAY_CONTAINS:
                // unsupported
                break;
            case IN:
                return checkNumberArrayContains(sourceNumber, destination);
            case ARRAY_CONTAINS_ANY:
                // unsupported
                break;
            case NOT_IN:
                return !checkNumberArrayContains(sourceNumber, destination);
        }


        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Could not perform comparison between " + source + ", " + destination + " with the operator " + operator.toString());
    }

    private static Boolean checkNumberArrayContains(Number sourceInteger, String arrayString) {
        try {
            JSONArray jsonArray = (JSONArray) parser.parse(arrayString);
            Object[] array = jsonArray.toArray();
            Boolean found = false;
            for (Object element : array) {
                Number value = new BigDecimal((String) element);
                int compare = NumberComparator.compare(value, sourceInteger);
                if (compare == 0) {
                    found = true;
                    break;
                }
            }
            return found;
        } catch (ParseException e) {
            // TODO : Handle this
        }

        return Boolean.FALSE;
    }

    public static Boolean compareStrings(String source, String destination, ConditionalOperator operator) {

        int compare = source.compareTo(destination);

        switch (operator) {
            case LT:
                return compare < 0 ? Boolean.TRUE : Boolean.FALSE;
            case LTE:
                return compare <= 0 ? Boolean.TRUE : Boolean.FALSE;
            case EQ:
                return compare == 0 ? Boolean.TRUE : Boolean.FALSE;
            case NOT_EQ:
                return compare != 0 ? Boolean.TRUE : Boolean.FALSE;
            case GT:
                return compare > 0 ? Boolean.TRUE : Boolean.FALSE;
            case GTE:
                return compare >= 0 ? Boolean.TRUE : Boolean.FALSE;
            case ARRAY_CONTAINS:
                // unsupported
                break;
            case IN:
                return checkStringArrayContains(source, destination);
            case ARRAY_CONTAINS_ANY:
                // unsupported
                break;
            case NOT_IN:
                return !checkStringArrayContains(source, destination);
        }

        return Boolean.FALSE;
    }

    private static Boolean checkStringArrayContains(String source, String arrayString) {
        try {
            JSONArray jsonArray = (JSONArray) parser.parse(arrayString);
            Object[] array = jsonArray.toArray();
            Boolean found = false;
            for (Object element : array) {
                String value = (String) element;
                int compare = source.compareTo(value);
                if (compare == 0) {
                    found = true;
                    break;
                }
            }
            return found;
        } catch (ParseException e) {
            // TODO : Handle this
        }

        return Boolean.FALSE;
    }

    public static Boolean compareBooleans(String source, String destination, ConditionalOperator operator) {
        Boolean sourceBoolean = Boolean.parseBoolean(source);
        Boolean destinationBoolean = Boolean.parseBoolean(destination);

        switch (operator) {
            case EQ:
                return sourceBoolean.equals(destinationBoolean) ? Boolean.TRUE : Boolean.FALSE;
            case NOT_EQ:
                return sourceBoolean.equals(destinationBoolean) ? Boolean.TRUE : Boolean.FALSE;
            case LT:
            case LTE:
            case GT:
            case GTE:
            case ARRAY_CONTAINS:
            case IN:
            case ARRAY_CONTAINS_ANY:
            case NOT_IN:
        }

        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                "Unsupported Comparison for boolean values with operator " + operator);
    }


    static class NumberComparator {

        public static int compare(Number a, Number b) {
            return new BigDecimal(a.toString()).compareTo(new BigDecimal(b.toString()));
        }

    }
}
