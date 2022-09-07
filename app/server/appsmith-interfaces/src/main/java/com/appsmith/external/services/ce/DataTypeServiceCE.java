package com.appsmith.external.services.ce;

import com.appsmith.external.datatypes.AppsmithType;
import com.appsmith.external.datatypes.ClientDataType;

import java.util.List;
import java.util.Map;

public interface DataTypeServiceCE {
    AppsmithType getAppsmithType(ClientDataType clientDataType, String value);
    AppsmithType getAppsmithType(ClientDataType clientDataType, String value, Map<ClientDataType, List<AppsmithType>> pluginSpecificTypes);
}
