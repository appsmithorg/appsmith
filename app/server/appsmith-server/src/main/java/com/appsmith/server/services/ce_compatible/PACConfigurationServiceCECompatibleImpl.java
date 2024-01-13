package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.services.ce.PACConfigurationServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class PACConfigurationServiceCECompatibleImpl extends PACConfigurationServiceCEImpl
        implements PACConfigurationServiceCECompatible {}
