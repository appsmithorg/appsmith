package com.appsmith.server.helpers;

import com.appsmith.external.models.WidgetSuggestionDTO;
import com.appsmith.external.models.WidgetType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeType;
import lombok.extern.slf4j.Slf4j;

import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

@Slf4j
public class WidgetSuggestionHelper {

    /**
     * Suggest the best widget to the query response. We currently planning to support List, Select, Table and Chart widgets
     * @return List of Widgets
     */

    public static List<WidgetSuggestionDTO> getSuggestedWidgets(Object data) {

        List<WidgetSuggestionDTO> widgetTypeList = new ArrayList<>();

        if(data instanceof ArrayNode && ((ArrayNode) data).isArray()) {
            if(!((ArrayNode) data).isEmpty()) {
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

                /*
                * We support only TEXT, CHART, DROPDOWN, TABLE, INPUT and LIST widgets as part of the suggestion
                * We need string and number type fields to construct the query to bind data to the above widgets
                */

                List<String> fields = new ArrayList<>();
                List<String> numericFields = new ArrayList<>();
                Iterator<Map.Entry<String, JsonNode>> jsonFields = node.fields();
                while(jsonFields.hasNext()) {
                    Map.Entry<String, JsonNode> jsonField = jsonFields.next();
                    if(JsonNodeType.STRING.equals(jsonField.getValue().getNodeType())) {
                        fields.add(jsonField.getKey());
                    }
                    if(JsonNodeType.NUMBER.equals(jsonField.getValue().getNodeType())) {
                        numericFields.add(jsonField.getKey());
                    }
                }

                if(JsonNodeType.STRING.equals(nodeType)) {
                    if (length > 1 && !fields.isEmpty()) {
                        widgetTypeList.add(getWidget(WidgetType.DROP_DOWN_WIDGET,fields.get(0), fields.get(0)));
                    }
                    else {
                        widgetTypeList.add(getWidget(WidgetType.TEXT_WIDGET));
                        widgetTypeList.add(getWidget(WidgetType.INPUT_WIDGET));
                    }
                }

                if(JsonNodeType.OBJECT.equals(nodeType) || JsonNodeType.ARRAY.equals(nodeType)) {
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
                }

                if(JsonNodeType.NUMBER.equals(nodeType)) {
                    widgetTypeList.add(getWidget(WidgetType.TEXT_WIDGET));
                    widgetTypeList.add(getWidget(WidgetType.INPUT_WIDGET));
                }
            }
        } else {
            if(data != null ) {
                widgetTypeList.add(getWidget(WidgetType.TEXT_WIDGET));
            }
        }
        return widgetTypeList;
    }

    private static WidgetSuggestionDTO getWidget(WidgetType widgetType, Object... args) {
        WidgetSuggestionDTO widgetSuggestionDTO = new WidgetSuggestionDTO();
        widgetSuggestionDTO.setType(widgetType);
        widgetSuggestionDTO.setBindingQuery(String.format(widgetType.getMessage(),args));
        return  widgetSuggestionDTO;
    }


}
