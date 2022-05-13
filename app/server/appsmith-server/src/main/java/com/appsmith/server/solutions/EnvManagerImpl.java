package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.configurations.GoogleRecaptchaConfig;
import com.appsmith.server.helpers.FileUtils;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.ce.EnvManagerCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_OIDC_CLIENT_ID;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_SSO_SAML_ENABLED;

@Component
@Slf4j
public class EnvManagerImpl extends EnvManagerCEImpl implements EnvManager {

    public EnvManagerImpl(SessionUserService sessionUserService,
                          UserService userService,
                          AnalyticsService analyticsService,
                          UserRepository userRepository,
                          PolicyUtils policyUtils,
                          EmailSender emailSender,
                          CommonConfig commonConfig,
                          EmailConfig emailConfig,
                          JavaMailSender javaMailSender,
                          GoogleRecaptchaConfig googleRecaptchaConfig,
                          FileUtils fileUtils) {

        super(sessionUserService, userService, analyticsService, userRepository, policyUtils, emailSender, commonConfig, emailConfig, javaMailSender,
                googleRecaptchaConfig, fileUtils);
    }

    /**
     *
     * @param originalVariables Already existing env variables
     * @param changes Changes in the env variables
     * @param extraAuthEnvs To incorporate extra authentication methods in enterprise edition
     * @return
     */
    @Override
    public List<Map> getAnalyticsEvents(Map<String, String> originalVariables, Map<String, String> changes, List<String> extraAuthEnvs) {
        // Adding extra authentication methods that are only present in EE
        extraAuthEnvs.addAll(List.of(APPSMITH_OAUTH2_OIDC_CLIENT_ID.name(), APPSMITH_SSO_SAML_ENABLED.name()));

        return super.getAnalyticsEvents(originalVariables, changes, extraAuthEnvs);
    }

    /**
     *
     * @param properties
     * @param newVariable Updated env variable value
     * @param originalVariable Already existing env variable value
     * @param authEnv Env variable name
     * @return
     */
    @Override
    public Map<String, String> setAnalyticsEventAction(Map<String, String> properties, String newVariable, String originalVariable, String authEnv) {
        // No need to override in case of non SAML authentication methods
        if(!authEnv.equals(APPSMITH_SSO_SAML_ENABLED.name())){
            return super.setAnalyticsEventAction(properties, newVariable, originalVariable, authEnv);
        }

        boolean isAuthenticationConfigAdded = newVariable.equals("true") && (originalVariable == null || originalVariable.equals("false"));
        boolean isAuthenticationConfigRemoved = newVariable.equals("false") && originalVariable.equals("true");

        if (isAuthenticationConfigAdded) {
            properties.put("action", "Added");
        }
        else if(isAuthenticationConfigRemoved)  {
            properties.put("action", "Removed");
        }

        return properties;
    }
}
