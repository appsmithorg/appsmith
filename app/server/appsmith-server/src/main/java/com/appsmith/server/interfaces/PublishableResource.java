package com.appsmith.server.interfaces;

import com.appsmith.external.interfaces.DeletableResource;
import com.appsmith.server.constants.ResourceModes;

public interface PublishableResource {
    DeletableResource select(ResourceModes mode);
}
