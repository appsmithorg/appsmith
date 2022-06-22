package com.appsmith.external.models;

import com.appsmith.external.constants.ConditionalOperator;
import com.appsmith.external.datatypes.AppsmithType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.services.DatatypeServiceImpl;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.apache.commons.lang3.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.apache.commons.lang3.StringUtils.isBlank;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Condition {

    public static final String PATH_KEY = "path";
    public static final String OPERATOR_KEY = "operator";

    String path;

    ConditionalOperator operator;

    Object value;

    @JsonIgnore
    AppsmithType valueAppsmithType;

    public Condition(String path, String operator, String value) {
        this.path = path;
        this.operator = ConditionalOperator.valueOf(operator);
        this.value = value;
    }

    public static List<Condition> addValueAppsmithType(List<Condition> conditionList) {

        return conditionList
                .stream()
                .map(condition -> {
                    if (condition.getValue() instanceof String) {
                        String value = (String) condition.getValue();
                        AppsmithType AppsmithType = DatatypeServiceImpl.getInstance().getAppsmithType(value);
                        condition.setValueAppsmithType(AppsmithType);
                    }
                    return condition;
                })
                .collect(Collectors.toList());
    }

    public static Condition addValueAppsmithType(Condition condition) {
        Object objValue = condition.getValue();

        if (objValue instanceof String) {
            String value = (String) condition.getValue();
            AppsmithType AppsmithType = DatatypeServiceImpl.getInstance().getAppsmithType(value);
            condition.setValueAppsmithType(AppsmithType);
        } else if (objValue instanceof List) {
            List<Condition> conditionList = (List<Condition>) objValue;
            List<Condition> updatedConditions = conditionList
                    .stream()
                    .map(subCondition -> addValueAppsmithType(subCondition))
                    .collect(Collectors.toList());
            condition.setValue(updatedConditions);
        }
        return condition;
    }

    /**
     * To evaluate 'Path' and 'Operator' to be available for filtering
     * 'Values' not evaluated for availability, to support searching empty values
     *
     * @param condition
     * @return Boolean
     */
    public static Boolean isValid(Condition condition) {

        if (StringUtils.isEmpty(condition.getPath()) || (condition.getOperator() == null)) {
            return false;
        }

        return true;
    }

    /**
     * To generate condition list based on selected condition
     * Mandatory inputs validated are path and operator
     * Value is optional and considered as a null input
     *
     * @param configurationList
     * @return
     */
    public static List<Condition> generateFromConfiguration(List<Object> configurationList) {
        List<Condition> conditionList = new ArrayList<>();

        for (Object config : configurationList) {
            Map<String, String> condition = (Map<String, String>) config;
            if (condition.entrySet().isEmpty()) {
                // Its an empty object set by the client for UX. Ignore the same
                continue;
            } else if (isColumnOrOperatorEmpty(condition)) {
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

    private static boolean isColumnOrOperatorEmpty(Map<String, String> condition) {
        return isBlank(condition.get(PATH_KEY)) || isBlank(condition.get(OPERATOR_KEY));
    }
}
