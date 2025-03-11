package com.appsmith.server.configurations;

import com.appsmith.server.configurations.ce.CsrfConfigCE;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CsrfConfig extends CsrfConfigCE {}
