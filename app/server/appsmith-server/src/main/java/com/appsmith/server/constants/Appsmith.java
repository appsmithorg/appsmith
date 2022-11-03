package com.appsmith.server.constants;

import java.util.List;

public class Appsmith {
    public final static String APPSMITH_REGISTERED = "appsmith_registered";
    // We default the origin header to the production deployment of the client's URL
    public static final String DEFAULT_ORIGIN_HEADER = "https://app.appsmith.com";

    public static final List<String> AUTO_CREATED_PERMISSION_GROUP = List.of(FieldName.INSTANCE_CONFIG);
}
