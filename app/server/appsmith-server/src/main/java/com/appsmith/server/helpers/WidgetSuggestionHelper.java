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

    private static final String chartWidgetQuery = "data.map( (obj) =>{ return  {x: obj.%s, y: obj.%s} } )";

    private static final String tableWidgetQuery = "data";

    private static final String listWidgetQuery = "data";

    private static final String selectWidgetQuery = "data.map( (obj) =>{ return  {label: obj.%s, value: obj.%s} } )";

    private static final String textWidgetQuery = "data";

    private static final String inputWidgetQuery = "data";

    /**
     * Suggest the best widget to the query response. We currently planning to support List, Select, Table and Chart widgets
     * @return List of Widgets
     */

    public static List<WidgetSuggestionDTO> getSuggestedWidgets(Object data) {

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();

        if(data instanceof ArrayNode && ((ArrayNode) data).isArray()) {
            if(!((ArrayNode) data).isEmpty()) {
                try {
                    ArrayNode array = (ArrayNode) data;
                    int length = array.size();
                    JsonNode node = array.get(0);
                    JsonNodeType nodeType = node.getNodeType();
                    List<String> fields = new ArrayList<>();
                    List<String> numericField = new ArrayList<>();

                    for(Iterator<Map.Entry<String, JsonNode>> jsonFields = node.fields(); jsonFields.hasNext();) {
                        Map.Entry<String, JsonNode> jsonField = jsonFields.next();
                        if(JsonNodeType.STRING.equals(jsonField.getValue().getNodeType())) {
                            fields.add(jsonField.getKey());
                        }
                        if(JsonNodeType.NUMBER.equals(jsonField.getValue().getNodeType())) {
                            numericField.add(jsonField.getKey());
                        }
                    }

                    if(JsonNodeType.STRING.equals(nodeType)) {
                        if (length > 1 && !fields.isEmpty()) {
                            widgetTypeList.add(getSelectWidget(fields.get(0), fields.get(0)));
                        }
                        else {
                            widgetTypeList.add(getTextWidget());
                            widgetTypeList.add(getInputWidget());
                        }
                    }

                    if(JsonNodeType.OBJECT.equals(nodeType) || JsonNodeType.ARRAY.equals(nodeType)) {
                        if(!fields.isEmpty()) {
                            if(fields.size() < 2) {
                                widgetTypeList.add(getSelectWidget(fields.get(0), fields.get(0)));
                            } else {
                                widgetTypeList.add(getSelectWidget(fields.get(0), fields.get(1)));
                            }
                            if(!numericField.isEmpty()) {
                                widgetTypeList.add(getChartWidget(fields.get(0), numericField.get(0)));
                            }
                        }
                        widgetTypeList.add(getTableWidget());
                        widgetTypeList.add(getListWidget());
                        widgetTypeList.add(getTextWidget());
                    }

                    if(JsonNodeType.NUMBER.equals(nodeType)) {
                        widgetTypeList.add(getInputWidget());
                        widgetTypeList.add(getTextWidget());
                    }

                } catch(ClassCastException e) {
                    log.warn("Error while casting data to suggest widget.", e);
                    widgetTypeList.add(getTextWidget());
                }
            }
        } else {
            if(data != null ) {
                widgetTypeList.add(getTextWidget());
            }
        }
        return widgetTypeList;
    }

    private static WidgetSuggestionDTO getChartWidget(String field1, String field2) {
        WidgetSuggestionDTO widgetSuggestionDTO = new WidgetSuggestionDTO();
        widgetSuggestionDTO.setType(WidgetType.CHART_WIDGET);
        widgetSuggestionDTO.setBindingQuery(String.format(chartWidgetQuery, field1, field2));
        return widgetSuggestionDTO;    }

    private static WidgetSuggestionDTO getTableWidget() {
        WidgetSuggestionDTO widgetSuggestionDTO = new WidgetSuggestionDTO();
        widgetSuggestionDTO.setType(WidgetType.TABLE_WIDGET);
        widgetSuggestionDTO.setBindingQuery(tableWidgetQuery);
        return widgetSuggestionDTO;    }

    private static WidgetSuggestionDTO getListWidget() {
        WidgetSuggestionDTO widgetSuggestionDTO = new WidgetSuggestionDTO();
        widgetSuggestionDTO.setType(WidgetType.LIST_WIDGET);
        widgetSuggestionDTO.setBindingQuery(listWidgetQuery);
        return widgetSuggestionDTO;
    }

    private static WidgetSuggestionDTO getSelectWidget(String field1, String field2) {
        WidgetSuggestionDTO widgetSuggestionDTO = new WidgetSuggestionDTO();
        widgetSuggestionDTO.setType(WidgetType.DROP_DOWN_WIDGET);
        widgetSuggestionDTO.setBindingQuery(String.format(selectWidgetQuery, field1, field2));
        return widgetSuggestionDTO;
    }

    private static WidgetSuggestionDTO getTextWidget() {
        WidgetSuggestionDTO widgetSuggestionDTO = new WidgetSuggestionDTO();
        widgetSuggestionDTO.setType(WidgetType.TEXT_WIDGET);
        widgetSuggestionDTO.setBindingQuery(textWidgetQuery);
        return widgetSuggestionDTO;
    }

    private static WidgetSuggestionDTO getInputWidget() {
        WidgetSuggestionDTO widgetSuggestionDTO = new WidgetSuggestionDTO();
        widgetSuggestionDTO.setType(WidgetType.INPUT_WIDGET);
        widgetSuggestionDTO.setBindingQuery(inputWidgetQuery);
        return widgetSuggestionDTO;
    }


}
