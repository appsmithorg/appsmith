package com.appsmith.server.configurations;

import reactor.core.publisher.Mono;
import reactor.util.context.Context;

public class ReactorContextHelper {

    private static final String REQ_ID_KEY = "reqId";

    public static String getReqId() {
        return (String) Mono.deferContextual(Mono::just)
                .map(ctx -> ctx.getOrDefault(REQ_ID_KEY, null))
                .block();
    }

    public static Context withReqId(Context context, String reqId) {
        return context.put(REQ_ID_KEY, reqId);
    }
}
