package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce.InstanceVariablesHelperCE;
import com.appsmith.server.services.ConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Helper class for accessing instance variables from the instance config
 */
@Component
@Slf4j
public class InstanceVariablesHelper extends InstanceVariablesHelperCE {

    public InstanceVariablesHelper(ConfigService configService) {
        super(configService);
    }
}
