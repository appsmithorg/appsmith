package com.appsmith.server.helpers;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ce.EmailServiceHelperCEImpl;
import com.appsmith.server.services.TenantService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.net.URL;
import java.util.Map;

import static com.appsmith.server.constants.EmailConstants.BRAND_BACKGROUND_COLOR;
import static com.appsmith.server.constants.EmailConstants.BRAND_FONT_COLOR;
import static com.appsmith.server.constants.EmailConstants.BRAND_PRIMARY_COLOR;
import static com.appsmith.server.constants.EmailConstants.EMAIL_VERIFICATION_EMAIL_TEMPLATE_EE;
import static com.appsmith.server.constants.EmailConstants.FORGOT_PASSWORD_TEMPLATE_EE;
import static com.appsmith.server.constants.EmailConstants.INSTANCE_ADMIN_INVITE_EMAIL_SUBJECT_EE;
import static com.appsmith.server.constants.EmailConstants.INVITE_TO_INSTANCE_ADMIN_EMAIL_TEMPLATE;
import static com.appsmith.server.constants.EmailConstants.INVITE_TO_WORKSPACE_EMAIL_SUBJECT_EE;
import static com.appsmith.server.constants.EmailConstants.INVITE_TO_WORKSPACE_EXISTING_USER_TEMPLATE_EE;
import static com.appsmith.server.constants.EmailConstants.INVITE_TO_WORKSPACE_NEW_USER_TEMPLATE_EE;
import static com.appsmith.server.constants.EmailConstants.LOGO_URL;
import static com.appsmith.server.constants.EmailConstants.PRIMARY_LINK_TEXT_INVITE_TO_INSTANCE_EE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INSTANCE_NAME;
import static com.appsmith.server.domains.TenantConfiguration.DEFAULT_APPSMITH_LOGO;

@Component
public class EmailServiceHelperImpl extends EmailServiceHelperCEImpl implements EmailServiceHelper {
    private final TenantService tenantService;

    public EmailServiceHelperImpl(TenantService tenantService) {
        super(tenantService);
        this.tenantService = tenantService;
    }

    @Override
    public Mono<Map<String, String>> enrichWithBrandParams(Map<String, String> params, String origin) {
        return tenantService.getTenantConfiguration().map(tenant -> {
            final TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
            params.put(INSTANCE_NAME, tenantConfiguration.getInstanceName());
            params.put(LOGO_URL, getBrandLogoUrl(tenantConfiguration.getBrandLogoUrl(), origin));
            params.put(BRAND_PRIMARY_COLOR, tenantConfiguration.getBrandColors().getPrimary());
            params.put(
                    BRAND_BACKGROUND_COLOR, tenantConfiguration.getBrandColors().getBackground());
            params.put(BRAND_FONT_COLOR, tenantConfiguration.getBrandColors().getFont());
            return params;
        });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public String getForgotPasswordTemplate() {
        return FORGOT_PASSWORD_TEMPLATE_EE;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public String getWorkspaceInviteTemplate(boolean isNewUser) {
        if (isNewUser) {
            return INVITE_TO_WORKSPACE_NEW_USER_TEMPLATE_EE;
        }

        return INVITE_TO_WORKSPACE_EXISTING_USER_TEMPLATE_EE;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public String getEmailVerificationTemplate() {
        return EMAIL_VERIFICATION_EMAIL_TEMPLATE_EE;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public String getAdminInstanceInviteTemplate() {
        return INVITE_TO_INSTANCE_ADMIN_EMAIL_TEMPLATE;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public String getJoinInstanceCtaPrimaryText() {
        return PRIMARY_LINK_TEXT_INVITE_TO_INSTANCE_EE;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public String getSubjectJoinInstanceAsAdmin(String instanceName) {
        return String.format(INSTANCE_ADMIN_INVITE_EMAIL_SUBJECT_EE, instanceName);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public String getSubjectJoinWorkspace(String workspaceName) {
        return String.format(INVITE_TO_WORKSPACE_EMAIL_SUBJECT_EE, workspaceName);
    }

    private String getBrandLogoUrl(String brandLogoUrl, String originURL) {
        try {
            URL url = new URL(originURL);
            String logoUrl = StringUtils.isNotEmpty(originURL) ? new URL(url, brandLogoUrl).toString() : null;
            new URL(logoUrl).toURI();
            return logoUrl;
        } catch (Exception invalidUrl) {
            return DEFAULT_APPSMITH_LOGO;
        }
    }
}
