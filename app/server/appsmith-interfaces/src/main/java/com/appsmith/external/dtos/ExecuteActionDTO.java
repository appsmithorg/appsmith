package com.appsmith.external.dtos;

import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.Param;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
@Setter
@ToString
public class ExecuteActionDTO {

    @JsonView(Views.Public.class)
    String actionId;

    @JsonView(Views.Public.class)
    List<Param> params;

    @JsonView(Views.Public.class)
    PaginationField paginationField;

    @JsonView(Views.Public.class)
    Boolean viewMode = false;

    /* Sample value of paramProperties
        "paramProperties": {
          "k1": "string",
          "k2": "object",
          "k3": "number",
          "k4": {
            "array": [
              "string",
              "number",
              "string",
              "boolean"
            ]
          },
          "k5": "boolean"
        }
    */
    @JsonView(Views.Public.class)
    Map<String, Object> paramProperties;

    @JsonView(Views.Public.class)
    Map<String, String> parameterMap; // e.g. {"Text1.text": "k1","Table1.data": "k2", "Api1.data": "k3"}

    @JsonView(Views.Public.class)
    Map<String, String> invertParameterMap; // e.g. {"k1":"Text1.text","k2":"Table1.data", "k3": "Api1.data"}

    @JsonView(Views.Public.class)
    public void setParameterMap(Map<String, String> parameterMap) {
        this.parameterMap = parameterMap;
        invertParameterMap = parameterMap.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getValue,
                        Map.Entry::getKey));
    }
}
