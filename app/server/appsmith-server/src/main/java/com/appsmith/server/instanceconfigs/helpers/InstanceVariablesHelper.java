package com.appsmith.server.instanceconfigs.helpers;

import com.appsmith.server.services.ConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class InstanceVariablesHelper extends InstanceVariablesHelperCE {
    public InstanceVariablesHelper(ConfigService configService) {
        super(configService);
    }
}
