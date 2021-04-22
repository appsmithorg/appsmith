package com.appsmith.external.models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
@AllArgsConstructor
public class RequestParamDTO {
    private String configProperty;
    private String value;
    private String label;
    private List<ParsedDataType> type;
}
