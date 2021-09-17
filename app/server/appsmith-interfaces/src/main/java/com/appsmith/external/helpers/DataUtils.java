package com.appsmith.external.helpers;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ConditionalOperator;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;

import java.util.concurrent.locks.Condition;

@Slf4j
public class DataUtils {
    private static JSONParser parser = new JSONParser(JSONParser.MODE_PERMISSIVE);


    public static Boolean compareNumbers(Object source, Object destination, ConditionalOperator operator) {
        Number sourceNumber = (Number) source;
        Number destinationNumber = (Number) destination;

        switch (operator) {
            case LT:
                return sourceNumber.compareTo(destinationNumber ? Boolean.TRUE : Boolean.FALSE;
            case LTE:
                return sourceNumber <= destinationNumber ? Boolean.TRUE : Boolean.FALSE;
            case EQ:
                return sourceNumber == destinationNumber ? Boolean.TRUE : Boolean.FALSE;
            case NOT_EQ:
                return sourceNumber != destinationNumber ? Boolean.TRUE : Boolean.FALSE;
            case GT:
                return sourceNumber > destinationNumber ? Boolean.TRUE : Boolean.FALSE;
            case GTE:
                return sourceNumber >= destinationNumber ? Boolean.TRUE : Boolean.FALSE;
            case ARRAY_CONTAINS:
                // unsupported
                break;
            case IN:
                return integerArrayContains(sourceNumber, destination);
            case ARRAY_CONTAINS_ANY:
                // unsupported
                break;
            case NOT_IN:
                return !integerArrayContains(sourceNumber, destination);
        }

    }


    public static Boolean compareInteger(String source, String destination, ConditionalOperator operator) {
        Integer sourceInteger = null;
        Integer destinationInteger = null;

        try {
            sourceInteger  = Integer.valueOf(source);
            destinationInteger = Integer.valueOf(destination);
        } catch (NumberFormatException e) {
            // Do nothing because this may be caused by arrays being passed.
        }

        switch (operator) {
            case LT:
                return sourceInteger < destinationInteger ? Boolean.TRUE : Boolean.FALSE;
            case LTE:
                return sourceInteger <= destinationInteger ? Boolean.TRUE : Boolean.FALSE;
            case EQ:
                return sourceInteger == destinationInteger ? Boolean.TRUE : Boolean.FALSE;
            case NOT_EQ:
                return sourceInteger != destinationInteger ? Boolean.TRUE : Boolean.FALSE;
            case GT:
                return sourceInteger > destinationInteger ? Boolean.TRUE : Boolean.FALSE;
            case GTE:
                return sourceInteger >= destinationInteger ? Boolean.TRUE : Boolean.FALSE;
            case ARRAY_CONTAINS:
                // unsupported
                break;
            case IN:
                return integerArrayContains(sourceInteger, destination);
            case ARRAY_CONTAINS_ANY:
                // unsupported
                break;
            case NOT_IN:
                return !integerArrayContains(sourceInteger, destination);
        }

        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Unsupported operator. Could not compare");
    }

    private static Boolean integerArrayContains(Integer sourceInteger, String arrayString) {
        try {
            JSONArray jsonArray = (JSONArray) parser.parse(arrayString);
            Object[] array = jsonArray.toArray();
            Boolean found = false;
            for (Object element : array) {
                Integer value = Integer.valueOf((String) element);
                if (sourceInteger == value) {
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

    public static Boolean compareFloat(String source, String destination, ConditionalOperator operator) {
        Float sourceFloat = null;
        Float destinationFloat = null;

        try {
            sourceFloat  = Float.valueOf(source);
            destinationFloat = Float.valueOf(destination);
        } catch (NumberFormatException e) {
            // Do nothing because this may be caused by arrays being passed.
        }

        switch (operator) {
            case LT:
                return sourceFloat < destinationFloat ? Boolean.TRUE : Boolean.FALSE;
            case LTE:
                return sourceFloat <= destinationFloat ? Boolean.TRUE : Boolean.FALSE;
            case EQ:
                return sourceFloat == destinationFloat ? Boolean.TRUE : Boolean.FALSE;
            case NOT_EQ:
                return sourceFloat != destinationFloat ? Boolean.TRUE : Boolean.FALSE;
            case GT:
                return sourceFloat > destinationFloat ? Boolean.TRUE : Boolean.FALSE;
            case GTE:
                return sourceFloat >= destinationFloat ? Boolean.TRUE : Boolean.FALSE;
            case ARRAY_CONTAINS:
                // unsupported
                break;
            case IN:
                return floatArrayContains(sourceFloat, destination);
            case ARRAY_CONTAINS_ANY:
                // unsupported
                break;
            case NOT_IN:
                return !floatArrayContains(sourceFloat, destination);
        }

        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Unsupported operator. Could not compare");
    }

    private static Boolean floatArrayContains(Float sourceFloat, String arrayString) {
        try {
            JSONArray jsonArray = (JSONArray) parser.parse(arrayString);
            Object[] array = jsonArray.toArray();
            Boolean found = false;
            for (Object element : array) {
                Float value = Float.valueOf((String) element);
                if (sourceFloat == value) {
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
}
