package com.appsmith.server.workflows.proxy;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.workflows.base.BaseWorkflowServiceCECompatibleImpl;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

@Service
public class ProxyWorkflowServiceCECompatibleImpl extends BaseWorkflowServiceCECompatibleImpl
        implements ProxyWorkflowServiceCECompatible {
    @Override
    public Mono<JSONObject> getWorkflowHistory(MultiValueMap<String, String> filters) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<JSONObject> getWorkflowHistoryByWorkflowId(String id, MultiValueMap<String, String> filters) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
