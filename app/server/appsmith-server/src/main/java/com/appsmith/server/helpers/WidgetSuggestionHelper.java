package com.appsmith.server.helpers;

import com.appsmith.external.models.WidgetSuggestionDTO;
import com.appsmith.external.models.WidgetType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
public class WidgetSuggestionHelper {

    @Getter
    @Setter
    @NoArgsConstructor
    private static class DataFields {
        List<String> fields;
        List<String> numericFields;
        List<String> objectFields;
    }

    /**
     * Suggest the best widget to the query response. We currently support Select, Table, Text and Chart widgets
     * @return List of Widgets with binding query
     */
    public static List<WidgetSuggestionDTO> getSuggestedWidgets(Object data) {

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();

        if(data instanceof ArrayNode) {
            widgetTypeList = handleArrayNode((ArrayNode) data);
        } else if(data instanceof JsonNode) {
            widgetTypeList = handleJsonNode((JsonNode) data);
        } else if (data instanceof List && !((List) data).isEmpty()) {
            widgetTypeList = handleList((List) data);
        } else if (data != null) {
            widgetTypeList.add(getWidget(WidgetType.TEXT_WIDGET));
        }
        return widgetTypeList;
    }

    private static List<WidgetSuggestionDTO> handleArrayNode(ArrayNode array) {
        if (array.isEmpty()) {
            return new ArrayList<>();
        }
        //TODO - check other data types
        if (array.isArray()) {
            int length = array.size();
            JsonNode node = array.get(0);
            JsonNodeType nodeType = node.getNodeType();

            DataFields dataFields = collectFieldsFromData(node.fields());

            if (JsonNodeType.STRING.equals(nodeType)) {
                return getWidgetsForTypeString(dataFields.getFields(), length);
            } else if (JsonNodeType.OBJECT.equals(nodeType) || JsonNodeType.ARRAY.equals(nodeType)) {
                return getWidgetsForTypeArray(dataFields.getFields(), dataFields.getNumericFields());
            } else if (JsonNodeType.NUMBER.equals(nodeType)) {
                return getWidgetsForTypeNumber();
            }
        }
        return new ArrayList<>();
    }

    private static List<WidgetSuggestionDTO> handleJsonNode(JsonNode node) {
        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        if (node.isEmpty()) {
            return widgetTypeList;
        }

        if (node.isObject()) {
            int length = node.size();
            JsonNodeType nodeType = node.getNodeType();

            DataFields dataFields = collectFieldsFromData(node.fields());

            if (JsonNodeType.STRING.equals(nodeType)) {
                widgetTypeList = getWidgetsForTypeString(dataFields.getFields(), length);
            } else if (JsonNodeType.ARRAY.equals(nodeType)) {
                widgetTypeList = getWidgetsForTypeArray(dataFields.getFields(), dataFields.getNumericFields());
            } else if (JsonNodeType.OBJECT.equals(nodeType)) {
                /*
                 * Get fields from nested object
                 * use the for table, list, chart and Select
                 */
                if (dataFields.objectFields.isEmpty()) {
                    widgetTypeList.add(getWidget(WidgetType.TEXT_WIDGET));
                } else {
                    String nestedFieldName = dataFields.getObjectFields().get(0);
                    if (node.get(nestedFieldName).size() == 0) {
                        widgetTypeList.add(getWidget(WidgetType.TEXT_WIDGET));
                    } else {
                        dataFields = collectFieldsFromData(node.get(nestedFieldName).get(0).fields());
                        widgetTypeList = getWidgetsForTypeNestedObject(nestedFieldName, dataFields.getFields(), dataFields.getNumericFields());
                    }
                }
            } else if (JsonNodeType.NUMBER.equals(nodeType)) {
                widgetTypeList = getWidgetsForTypeNumber();
            }
        } else if (node.isArray() || node.isNumber() || node.isTextual()) {
            DataFields dataFields = collectFieldsFromData(node.fields());
            widgetTypeList = getWidgetsForTypeString(dataFields.getFields(), 0);
        }
        return widgetTypeList;
    }

    private static List<WidgetSuggestionDTO> handleList(List dataList) {
        if (dataList.get(0) instanceof Map) {
            Map map = (Map) dataList.get(0);
            Set fieldList = map.keySet();
            List<String> fields = new ArrayList<>();
            List<String> numericFields = new ArrayList<>();

            //Get all the fields from the object and check for the possible widget match
            for (Object key : fieldList) {
                if (map.get(key) instanceof String) {
                    fields.add(((String) key));
                }
                if (map.get(key) instanceof Number) {
                    numericFields.add(((String) key));
                }
            }
            return getWidgetsForTypeArray(fields, numericFields);
        }
        return List.of(getWidget(WidgetType.TABLE_WIDGET), getWidget(WidgetType.TEXT_WIDGET));
    }

    /*
     * We support only TEXT, CHART, DROPDOWN, TABLE, INPUT widgets as part of the suggestion
     * We need string and number type fields to construct the query which will bind data to the above widgets
     */
    private static DataFields collectFieldsFromData(Iterator<Map.Entry<String, JsonNode>> jsonFields) {
        DataFields dataFields = new DataFields();
        List<String> fields = new ArrayList<>();
        List<String> numericFields = new ArrayList<>();
        List<String> objectFields = new ArrayList<>();
        while(jsonFields.hasNext()) {
            Map.Entry<String, JsonNode> jsonField = jsonFields.next();
            if(JsonNodeType.STRING.equals(jsonField.getValue().getNodeType())) {
                fields.add(jsonField.getKey());
            }
            if(JsonNodeType.NUMBER.equals(jsonField.getValue().getNodeType())) {
                numericFields.add(jsonField.getKey());
            }

            if(JsonNodeType.ARRAY.equals(jsonField.getValue().getNodeType())) {
                objectFields.add(jsonField.getKey());
            }
        }
        dataFields.setFields(fields);
        dataFields.setNumericFields(numericFields);
        dataFields.setObjectFields(objectFields);
        return dataFields;
    }

    private static List<WidgetSuggestionDTO> getWidgetsForTypeString(List<String> fields, int length) {
        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        if (length > 1 && !fields.isEmpty()) {
            widgetTypeList.add(getWidget(WidgetType.DROP_DOWN_WIDGET, fields.get(0), fields.get(0)));
        }
        else {
            widgetTypeList.add(getWidget(WidgetType.TEXT_WIDGET));
            widgetTypeList.add(getWidget(WidgetType.INPUT_WIDGET));
        }
        return widgetTypeList;
    }

    private static List<WidgetSuggestionDTO> getWidgetsForTypeArray(List<String> fields, List<String> numericFields) {
        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        if(!fields.isEmpty()) {
            if(fields.size() < 2) {
                widgetTypeList.add(getWidget(WidgetType.DROP_DOWN_WIDGET, fields.get(0), fields.get(0)));
            } else {
                widgetTypeList.add(getWidget(WidgetType.DROP_DOWN_WIDGET, fields.get(0), fields.get(0)));
            }
            if(!numericFields.isEmpty()) {
                widgetTypeList.add(getWidget(WidgetType.CHART_WIDGET, fields.get(0), numericFields.get(0)));
            }
        }
        widgetTypeList.add(getWidget(WidgetType.TABLE_WIDGET));
        widgetTypeList.add(getWidget(WidgetType.TEXT_WIDGET));
        return widgetTypeList;
    }

    private static List<WidgetSuggestionDTO> getWidgetsForTypeNumber() {
        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(getWidget(WidgetType.TEXT_WIDGET));
        widgetTypeList.add(getWidget(WidgetType.INPUT_WIDGET));
        return widgetTypeList;
    }

    /**
     * When the response from the action is has nested data(Ex : Object containing array of fields) and only 1 level is supported
     * For nested data, the binding query changes from data.map() --> data.nestedFieldName.map()
     */
    private static List<WidgetSuggestionDTO> getWidgetsForTypeNestedObject(String nestedFieldName,
                                                                           List<String> fields,
                                                                           List<String> numericFields) {
        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        /*
        * fields - contains all the fields inside the nested data and nested data is considered to only 1 level
        * numericFields - contains fields of type number
        * For the CHART widget we need at least one field of type int and one string type field
        * For the DROP_DOWN at least one String type field
        * */
        if(!fields.isEmpty()) {
            if(fields.size() < 2) {
                widgetTypeList.add(getWidgetNestedData(WidgetType.DROP_DOWN_WIDGET, nestedFieldName, fields.get(0), fields.get(0)));
            } else {
                widgetTypeList.add(getWidgetNestedData(WidgetType.DROP_DOWN_WIDGET, nestedFieldName, fields.get(0), fields.get(1)));
            }
            if(!numericFields.isEmpty()) {
                widgetTypeList.add(getWidgetNestedData(WidgetType.CHART_WIDGET, nestedFieldName, fields.get(0), numericFields.get(0)));
            }
        }
        widgetTypeList.add(getWidgetNestedData(WidgetType.TABLE_WIDGET, nestedFieldName));
        widgetTypeList.add(getWidgetNestedData(WidgetType.TEXT_WIDGET, nestedFieldName));
        return widgetTypeList;
    }

    public static WidgetSuggestionDTO getWidget(WidgetType widgetType, Object... args) {
        WidgetSuggestionDTO widgetSuggestionDTO = new WidgetSuggestionDTO();
        widgetSuggestionDTO.setType(widgetType);
        widgetSuggestionDTO.setBindingQuery(String.format(widgetType.getMessage(),args));
        return  widgetSuggestionDTO;
    }

    public static WidgetSuggestionDTO getWidgetNestedData(WidgetType widgetType, String nestedFieldName, Object... args) {
        WidgetSuggestionDTO widgetSuggestionDTO = new WidgetSuggestionDTO();
        widgetSuggestionDTO.setType(widgetType);
        String query = String.format(widgetType.getMessage(), args);
        query = query.replace("data", "data."+nestedFieldName);
        widgetSuggestionDTO.setBindingQuery(query);
        return  widgetSuggestionDTO;
    }

}
