package com.external.plugins.services;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.dtos.Query;

public interface AiFeatureService {
    Query createQuery(ActionConfiguration actionConfiguration, ExecuteActionDTO executeActionDTO);
}
