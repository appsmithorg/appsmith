package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.services.TenantService;
import lombok.AllArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Map;

import static com.appsmith.server.constants.ce.EmailConstantsCE.EMAIL_VERIFICATION_EMAIL_TEMPLATE_CE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.FORGOT_PASSWORD_TEMPLATE_CE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INSTANCE_ADMIN_INVITE_EMAIL_TEMPLATE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INSTANCE_NAME;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INVITE_WORKSPACE_TEMPLATE_EXISTING_USER_CE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INVITE_WORKSPACE_TEMPLATE_NEW_USER_CE;

@Component
@AllArgsConstructor
public class EmailServiceHelperCEImpl implements EmailServiceHelperCE {

    private final TenantService tenantService;

    @Override
    public Mono<Map<String, String>> enrichWithBrandParams(Map<String, String> params) {
        return tenantService.getTenantConfiguration().map(tenant -> {
            final TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
            params.put(INSTANCE_NAME, StringUtils.defaultIfEmpty(tenantConfiguration.getInstanceName(), "Appsmith"));
            return params;
        });
    }

    @Override
    public String getForgotPasswordTemplate() {
        return FORGOT_PASSWORD_TEMPLATE_CE;
    }

    @Override
    public String getWorkspaceInviteTemplate(boolean isNewUser) {
        if (isNewUser) return INVITE_WORKSPACE_TEMPLATE_NEW_USER_CE;

        return INVITE_WORKSPACE_TEMPLATE_EXISTING_USER_CE;
    }

    @Override
    public String getEmailVerificationTemplate() {
        return EMAIL_VERIFICATION_EMAIL_TEMPLATE_CE;
    }

    @Override
    public String getAdminInstanceInviteTemplate() {
        return INSTANCE_ADMIN_INVITE_EMAIL_TEMPLATE;
    }
}
