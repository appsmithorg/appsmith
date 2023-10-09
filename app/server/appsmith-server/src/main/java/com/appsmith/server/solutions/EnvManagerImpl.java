package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.configurations.GoogleRecaptchaConfig;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.FileUtils;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.AssetService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.EmailService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.ce.EnvManagerCEImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.http.codec.multipart.Part;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_OIDC_CLIENT_ID;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_SSO_SAML_ENABLED;
import static com.appsmith.server.domains.TenantConfiguration.ASSET_PREFIX;

@Component
@Slf4j
public class EnvManagerImpl extends EnvManagerCEImpl implements EnvManager {

    private final AssetService assetService;

    private static final Set<String> ASSET_VALUE_KEYS = Set.of("APPSMITH_BRAND_LOGO", "APPSMITH_BRAND_FAVICON");

    private static final int MAX_LOGO_SIZE_KB = 1024;

    public EnvManagerImpl(
            SessionUserService sessionUserService,
            UserService userService,
            AnalyticsService analyticsService,
            UserRepository userRepository,
            EmailSender emailSender,
            CommonConfig commonConfig,
            EmailConfig emailConfig,
            JavaMailSender javaMailSender,
            GoogleRecaptchaConfig googleRecaptchaConfig,
            FileUtils fileUtils,
            PermissionGroupService permissionGroupService,
            ConfigService configService,
            UserUtils userUtils,
            TenantService tenantService,
            ObjectMapper objectMapper,
            AssetService assetService,
            EmailService emailService) {

        super(
                sessionUserService,
                userService,
                analyticsService,
                userRepository,
                emailSender,
                commonConfig,
                emailConfig,
                javaMailSender,
                googleRecaptchaConfig,
                fileUtils,
                permissionGroupService,
                configService,
                userUtils,
                tenantService,
                objectMapper,
                emailService);
        this.assetService = assetService;
    }

    /**
     *
     * @param originalVariables Already existing env variables
     * @param changes Changes in the env variables
     * @param extraAuthEnvs To incorporate extra authentication methods in enterprise edition
     * @return
     */
    @Override
    public List<Map<String, Object>> getAnalyticsEvents(
            Map<String, String> originalVariables, Map<String, String> changes, List<String> extraAuthEnvs) {
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
    public void setAnalyticsEventAction(
            Map<String, Object> properties, String newVariable, String originalVariable, String authEnv) {
        // No need to override in case of non SAML authentication methods
        if (!authEnv.equals(APPSMITH_SSO_SAML_ENABLED.name())) {
            super.setAnalyticsEventAction(properties, newVariable, originalVariable, authEnv);
        }

        boolean isAuthenticationConfigAdded =
                newVariable.equals("true") && (originalVariable == null || originalVariable.equals("false"));
        boolean isAuthenticationConfigRemoved = newVariable.equals("false") && originalVariable.equals("true");

        if (isAuthenticationConfigAdded) {
            properties.put("action", "Added");
        } else if (isAuthenticationConfigRemoved) {
            properties.put("action", "Removed");
        }
    }

    @Override
    @NotNull public Mono<Map.Entry<String, String>> handleFileUpload(String key, List<Part> parts) {
        if (!ASSET_VALUE_KEYS.contains(key)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, key));
        }
        // TODO: Delete existing/previous logo, if present.
        return assetService
                .upload(parts, MAX_LOGO_SIZE_KB, false)
                .map(asset -> Map.entry(key, ASSET_PREFIX + asset.getId()));
    }
}
