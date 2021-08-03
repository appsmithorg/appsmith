package com.appsmith.server.helpers;

import com.appsmith.external.models.WidgetSuggestionDTO;
import com.appsmith.external.models.WidgetType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeType;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

@Slf4j
public class WidgetSuggestionHelper {

    private static List<String> fields;
    private static List<String> numericFields;
    private static List<String> objectFields;

    /**
     * Suggest the best widget to the query response. We currently planning to support List, Select, Table, Text and Chart widgets
     * @return List of Widgets with binding query
     */
    public static List<WidgetSuggestionDTO> getSuggestedWidgets(Object data) {

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();

        if(data instanceof ArrayNode) {
            if( ((ArrayNode) data).isEmpty() ) {
                return widgetTypeList;
            }
            if(((ArrayNode) data).isArray()) {
                ArrayNode array = null;
                try {
                    array = (ArrayNode) data;
                } catch(ClassCastException e) {
                    log.warn("Error while casting data to suggest widget.", e);
                    widgetTypeList.add(getWidget(WidgetType.TEXT_WIDGET));
                }
                int length = array.size();
                JsonNode node = array.get(0);
                JsonNodeType nodeType = node.getNodeType();

                collectFieldsFromData(node.fields());

                if(JsonNodeType.STRING.equals(nodeType)) {
                    widgetTypeList = getWidgetsForTypeString(fields, length);
                }

                if(JsonNodeType.OBJECT.equals(nodeType) || JsonNodeType.ARRAY.equals(nodeType)) {
                    widgetTypeList = getWidgetsForTypeArray(fields, numericFields);
                }

                if(JsonNodeType.NUMBER.equals(nodeType)) {
                    widgetTypeList = getWidgetsForTypeNumber();
                }
            }
        } else {
            if(data instanceof JsonNode) {
                if (((JsonNode) data).isEmpty()) {
                    return widgetTypeList;
                }
                if (((JsonNode) data).isObject()) {
                    ObjectNode node = (ObjectNode) data;
                    int length = node.size();
                    JsonNodeType nodeType = node.getNodeType();

                    collectFieldsFromData(node.fields());

                    if(JsonNodeType.STRING.equals(nodeType)) {
                        widgetTypeList = getWidgetsForTypeString(fields, length);
                    }

                    if(JsonNodeType.ARRAY.equals(nodeType)) {
                        widgetTypeList = getWidgetsForTypeArray(fields, numericFields);
                    }

                    if(JsonNodeType.OBJECT.equals(nodeType)) {
                        //get fields from nested object
                        //use the for table, list, chart and Select
                        if(objectFields.isEmpty()) {
                            widgetTypeList.add(getWidget(WidgetType.TEXT_WIDGET));
                        } else {
                            String nestedFieldName = objectFields.get(0);
                            collectFieldsFromData(node.get(nestedFieldName).get(0).fields());
                            widgetTypeList = getWidgetsForTypeNestedObject(nestedFieldName);
                        }
                    }

                    if(JsonNodeType.NUMBER.equals(nodeType)) {
                        widgetTypeList = getWidgetsForTypeNumber();
                    }
                }

                if(((JsonNode) data).isArray() || ((JsonNode) data).isNumber() || ((JsonNode) data).isTextual() ) {
                    widgetTypeList = getWidgetsForTypeString(fields, 0);
                }
            }
            else {
                if (data != null ) {
                    widgetTypeList.add(getWidget(WidgetType.TEXT_WIDGET));
                }
            }
        }
        return widgetTypeList;
    }

    /*
     * We support only TEXT, CHART, DROPDOWN, TABLE, INPUT and LIST widgets as part of the suggestion
     * We need string and number type fields to construct the query which will bind data to the above widgets
     */
    private static void collectFieldsFromData(Iterator<Map.Entry<String, JsonNode>> jsonFields) {
        fields = new ArrayList<>();
        numericFields = new ArrayList<>();
        objectFields = new ArrayList<>();
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
    }

    private static List<WidgetSuggestionDTO> getWidgetsForTypeString(List<String> fields, int length) {
        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        if (length > 1 && !fields.isEmpty()) {
            widgetTypeList.add(getWidget(WidgetType.DROP_DOWN_WIDGET,fields.get(0), fields.get(0)));
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
                widgetTypeList.add(getWidget(WidgetType.DROP_DOWN_WIDGET,fields.get(0), fields.get(0)));
            } else {
                widgetTypeList.add(getWidget(WidgetType.DROP_DOWN_WIDGET,fields.get(0), fields.get(0)));
            }
            if(!numericFields.isEmpty()) {
                widgetTypeList.add(getWidget(WidgetType.CHART_WIDGET,fields.get(0), numericFields.get(0)));
            }
        }
        widgetTypeList.add(getWidget(WidgetType.TABLE_WIDGET));
        widgetTypeList.add(getWidget(WidgetType.LIST_WIDGET));
        widgetTypeList.add(getWidget(WidgetType.TEXT_WIDGET));
        return widgetTypeList;
    }

    private static List<WidgetSuggestionDTO> getWidgetsForTypeNumber() {
        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        widgetTypeList.add(getWidget(WidgetType.TEXT_WIDGET));
        widgetTypeList.add(getWidget(WidgetType.INPUT_WIDGET));
        return widgetTypeList;
    }

    private static List<WidgetSuggestionDTO> getWidgetsForTypeNestedObject(String nestedFieldName) {
        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();
        if(!fields.isEmpty()) {
            if(fields.size() < 2) {
                widgetTypeList.add(getWidgetNestedData(WidgetType.DROP_DOWN_WIDGET,nestedFieldName, fields.get(0), fields.get(0)));
            } else {
                widgetTypeList.add(getWidgetNestedData(WidgetType.DROP_DOWN_WIDGET,nestedFieldName, fields.get(0), fields.get(1)));
            }
            if(!numericFields.isEmpty()) {
                widgetTypeList.add(getWidgetNestedData(WidgetType.CHART_WIDGET,nestedFieldName, fields.get(0), numericFields.get(0)));
            }
        }
        widgetTypeList.add(getWidgetNestedData(WidgetType.TABLE_WIDGET, nestedFieldName));
        widgetTypeList.add(getWidgetNestedData(WidgetType.LIST_WIDGET, nestedFieldName));
        widgetTypeList.add(getWidgetNestedData(WidgetType.TEXT_WIDGET, nestedFieldName));
        return widgetTypeList;
    }

    private static WidgetSuggestionDTO getWidget(WidgetType widgetType, Object... args) {
        WidgetSuggestionDTO widgetSuggestionDTO = new WidgetSuggestionDTO();
        widgetSuggestionDTO.setType(widgetType);
        widgetSuggestionDTO.setBindingQuery(String.format(widgetType.getMessage(),args));
        return  widgetSuggestionDTO;
    }

    private static WidgetSuggestionDTO getWidgetNestedData(WidgetType widgetType, String nestedFieldName, Object... args) {
        WidgetSuggestionDTO widgetSuggestionDTO = new WidgetSuggestionDTO();
        widgetSuggestionDTO.setType(widgetType);
        String query = String.format(widgetType.getMessage(), args);
        query = query.replace("data", "data."+nestedFieldName);
        widgetSuggestionDTO.setBindingQuery(query);
        return  widgetSuggestionDTO;
    }


}
