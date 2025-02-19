package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.services.OrganizationService;
import org.apache.commons.lang3.StringUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import reactor.test.StepVerifier;

import java.util.HashMap;

import static com.appsmith.server.constants.ce.EmailConstantsCE.EMAIL_VERIFICATION_EMAIL_TEMPLATE_CE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.FORGOT_PASSWORD_TEMPLATE_CE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INSTANCE_ADMIN_INVITE_EMAIL_TEMPLATE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INSTANCE_NAME;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INVITE_WORKSPACE_TEMPLATE_EXISTING_USER_CE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INVITE_WORKSPACE_TEMPLATE_NEW_USER_CE;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(AfterAllCleanUpExtension.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
public class EmailServiceHelperCETest {

    @Autowired
    @Qualifier("emailServiceHelperCEImpl") private EmailServiceHelperCE emailServiceHelperCE;

    @Autowired
    OrganizationService organizationService;

    @Test
    @WithUserDetails(value = "api_user")
    public void testEnrichWithBrandParams() {
        Organization defautOrganization =
                organizationService.getOrganizationConfiguration().block();
        String instanceName = StringUtils.defaultIfEmpty(
                defautOrganization.getOrganizationConfiguration().getInstanceName(), "Appsmith");
        StepVerifier.create(emailServiceHelperCE.enrichWithBrandParams(new HashMap<>(), "www.test.com"))
                .assertNext(map -> {
                    assertThat(map.containsKey(INSTANCE_NAME)).isTrue();
                    assertThat(map.get(INSTANCE_NAME)).isEqualTo(instanceName);
                })
                .verifyComplete();
    }

    @Test
    void testGetForgotPasswordTemplate() {
        assertThat(emailServiceHelperCE.getForgotPasswordTemplate()).isEqualTo(FORGOT_PASSWORD_TEMPLATE_CE);
    }

    @Test
    void testGetWorkspaceInviteTemplate() {
        assertThat(emailServiceHelperCE.getWorkspaceInviteTemplate(Boolean.TRUE))
                .isEqualTo(INVITE_WORKSPACE_TEMPLATE_NEW_USER_CE);
        assertThat(emailServiceHelperCE.getWorkspaceInviteTemplate(Boolean.FALSE))
                .isEqualTo(INVITE_WORKSPACE_TEMPLATE_EXISTING_USER_CE);
    }

    @Test
    void testGetEmailVerificationTemplate() {
        assertThat(emailServiceHelperCE.getEmailVerificationTemplate()).isEqualTo(EMAIL_VERIFICATION_EMAIL_TEMPLATE_CE);
    }

    @Test
    void testGetAdminInstanceInviteTemplate() {
        assertThat(emailServiceHelperCE.getAdminInstanceInviteTemplate())
                .isEqualTo(INSTANCE_ADMIN_INVITE_EMAIL_TEMPLATE);
    }
}
