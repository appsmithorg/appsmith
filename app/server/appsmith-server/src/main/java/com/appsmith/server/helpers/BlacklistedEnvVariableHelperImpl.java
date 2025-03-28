package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce.BlacklistedEnvVariableHelperCEImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BlacklistedEnvVariableHelperImpl extends BlacklistedEnvVariableHelperCEImpl
        implements BlacklistedEnvVariableHelper {}
