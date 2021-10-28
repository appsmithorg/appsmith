package com.appsmith.external.models;

import com.appsmith.external.constants.ConditionalOperator;
import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.apache.commons.lang3.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.DataTypeStringUtils.stringToKnownDataTypeConverter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Condition {

    String path;

    ConditionalOperator operator;

    Object value;

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
                    if (condition.getValue() instanceof String) {
                        String value = (String) condition.getValue();
                        DataType dataType = stringToKnownDataTypeConverter(value);
                        condition.setValueDataType(dataType);
                    }
                    return condition;
                })
                .collect(Collectors.toList());
    }

    public static Condition addValueDataType(Condition condition) {
        Object objValue = condition.getValue();

        if (objValue instanceof String) {
            String value = (String) condition.getValue();
            DataType dataType = stringToKnownDataTypeConverter(value);
            condition.setValueDataType(dataType);
        } else if (objValue instanceof List) {
            List<Condition> conditionList = (List<Condition>) objValue;
            List<Condition> updatedConditions = conditionList
                    .stream()
                    .map(subCondition -> addValueDataType(subCondition))
                    .collect(Collectors.toList());
            condition.setValue(updatedConditions);
        }
        return condition;
    }

    public static Boolean isValid(Condition condition) {

        if (StringUtils.isEmpty(condition.getPath()) ||
                (condition.getOperator() == null) ||
                StringUtils.isEmpty((CharSequence) condition.getValue())) {
            return false;
        }

        return true;
    }

    public static List<Condition> generateFromConfiguration(List<Object> configurationList) {
        List<Condition> conditionList = new ArrayList<>();

        for(Object config : configurationList) {
            Map<String, String> condition = (Map<String, String>) config;
            if (condition.entrySet().isEmpty()) {
                // Its an empty object set by the client for UX. Ignore the same
                continue;
            } else if (!condition.keySet().containsAll(Set.of("path", "operator", "value"))) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Filtering Condition not configured properly");
            }
            conditionList.add(new Condition(
                    condition.get("path"),
                    condition.get("operator"),
                    condition.get("value")
            ));
        }

        return conditionList;
    }
}
