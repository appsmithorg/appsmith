package com.appsmith.server.services;

import com.appsmith.server.services.ce_compatible.PACConfigurationServiceCECompatibleImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class PACConfigurationServiceImpl extends PACConfigurationServiceCECompatibleImpl
        implements PACConfigurationService {}
