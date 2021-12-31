package com.appsmith.server.services;

import com.appsmith.server.services.ce.AuthenticationValidatorCEImpl;
import com.appsmith.server.solutions.AuthenticationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AuthenticationValidatorImpl extends AuthenticationValidatorCEImpl implements AuthenticationValidator {

    public AuthenticationValidatorImpl(AuthenticationService authenticationService) {
        super(authenticationService);
    }
}
