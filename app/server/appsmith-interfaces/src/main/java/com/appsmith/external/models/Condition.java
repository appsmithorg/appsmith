package com.appsmith.external.models;

import com.appsmith.external.constants.ConditionalOperator;
import com.appsmith.external.constants.DataType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.apache.commons.lang3.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.DataTypeStringUtils.stringToKnownDataTypeConverter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Condition {

    String path;

    ConditionalOperator operator;

    String value;

    @JsonIgnore
    DataType valueDataType;

    public Condition(String path, String operator, String value) {
        this.path = path;
        this.operator = ConditionalOperator.valueOf(operator);
        this.value = value;
    }

    public static List<Condition> addValueDataType(List<Condition> conditionList) {

        return conditionList
                .stream()
                .map(condition -> {
                    String value = condition.getValue();
                    DataType dataType = stringToKnownDataTypeConverter(value);
                    condition.setValueDataType(dataType);
                    return condition;
                })
                .collect(Collectors.toList());
    }

    public static Boolean isValid(Condition condition) {

        if (StringUtils.isEmpty(condition.getPath()) ||
                (condition.getOperator() == null) ||
                StringUtils.isEmpty(condition.getValue())) {
            return false;
        }

        return true;
    }
}
