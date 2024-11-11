package com.appsmith.server.projections;

import com.appsmith.external.models.Policy;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Map;

@AllArgsConstructor
@Getter
public class BaseView {
    String id;
    Map<String, Policy> policyMap;
}
