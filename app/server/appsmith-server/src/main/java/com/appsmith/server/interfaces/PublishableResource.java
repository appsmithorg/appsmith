package com.appsmith.server.interfaces;

import com.appsmith.external.interfaces.PublishableDTO;
import com.appsmith.server.constants.ResourceModes;

public interface PublishableResource {
    PublishableDTO select(ResourceModes mode);
}
