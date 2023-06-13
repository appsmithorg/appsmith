/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.AuthenticationFailureHandlerCE;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthenticationFailureHandler extends AuthenticationFailureHandlerCE {}
