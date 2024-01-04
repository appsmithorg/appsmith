package com.appsmith.server.moduleconvertible.helper;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ModuleInput;
import com.appsmith.server.modules.helpers.ModuleUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class ModuleConvertibleHelperServiceImpl implements ModuleConvertibleHelper {
    @Override
    public Tuple2<List<ModuleInput>, ActionConfiguration> generateChildrenInputsForModule(
            Set<String> jsonPathKeys, ActionConfiguration actionConfiguration) {
        if (jsonPathKeys == null || jsonPathKeys.isEmpty()) {
            return Tuples.of(Collections.emptyList(), actionConfiguration);
        }
        String defaultInputFieldName = "input%s";
        AtomicInteger atomicInteger = new AtomicInteger(0);
        final Set<String> uniqueIdSet = new HashSet<>();
        Map<String, String> jsonPathKeyToInputMap = new HashMap<>();
        List<ModuleInput> moduleInputs = new ArrayList<>();
        jsonPathKeys.forEach(jsonPathKey -> {
            int counter = atomicInteger.incrementAndGet();
            String newNameForReplacement = String.format("inputs.input%s", counter);
            String newNameForInputField = String.format(defaultInputFieldName, counter);
            jsonPathKeyToInputMap.put(jsonPathKey, "{{" + newNameForReplacement + "}}");

            ModuleInput moduleInput = new ModuleInput();
            String inputId = ModuleUtils.generateUniqueIdForInputField();
            while (!uniqueIdSet.add(inputId)) {
                inputId = ModuleUtils.generateUniqueIdForInputField();
            }
            moduleInput.setId(inputId);
            moduleInput.setControlType("INPUT_TEXT");
            moduleInput.setLabel(newNameForInputField);
            moduleInput.setPropertyName("inputs." + newNameForInputField);
            moduleInput.setDefaultValue("{{" + jsonPathKey + "}}");

            moduleInputs.add(moduleInput);
        });

        MustacheHelper.renderFieldValues(actionConfiguration, jsonPathKeyToInputMap);

        return Tuples.of(moduleInputs, actionConfiguration);
    }
}
