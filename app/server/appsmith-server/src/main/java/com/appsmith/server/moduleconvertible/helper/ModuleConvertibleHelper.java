package com.appsmith.server.moduleconvertible.helper;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ModuleInput;
import reactor.util.function.Tuple2;

import java.util.List;
import java.util.Set;

public interface ModuleConvertibleHelper {
    Tuple2<List<ModuleInput>, ActionConfiguration> generateChildrenInputsForModule(
            Set<String> jsonPathKeys, ActionConfiguration actionConfiguration);
}
