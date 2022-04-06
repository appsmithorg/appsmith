package com.appsmith.server.solutions;

import com.appsmith.server.authentication.handlers.AuthenticationSuccessHandler;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.CaptchaService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.ce.UserSignupCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class UserSignupImpl extends UserSignupCEImpl implements UserSignup {

    public UserSignupImpl(UserService userService,
                          UserDataService userDataService,
                          CaptchaService captchaService,
                          AuthenticationSuccessHandler authenticationSuccessHandler,
                          ConfigService configService,
                          AnalyticsService analyticsService,
                          PolicyUtils policyUtils,
                          EnvManager envManager,
                          CommonConfig commonConfig) {

        super(userService, userDataService, captchaService, authenticationSuccessHandler, configService,
                analyticsService, policyUtils, envManager, commonConfig);
    }
}
