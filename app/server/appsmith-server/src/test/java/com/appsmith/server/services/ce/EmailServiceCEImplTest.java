package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.services.TenantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

import static com.appsmith.server.constants.ce.EmailConstantsCE.EMAIL_ROLE_ADMINISTRATOR_TEXT;
import static com.appsmith.server.constants.ce.EmailConstantsCE.FORGOT_PASSWORD_EMAIL_SUBJECT;
import static com.appsmith.server.constants.ce.EmailConstantsCE.FORGOT_PASSWORD_TEMPLATE_CE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INSTANCE_ADMIN_INVITE_EMAIL_SUBJECT;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INSTANCE_ADMIN_INVITE_EMAIL_TEMPLATE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INSTANCE_NAME;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INVITER_FIRST_NAME;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INVITER_WORKSPACE_NAME;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INVITE_WORKSPACE_TEMPLATE_CE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.PRIMARY_LINK_TEXT;
import static com.appsmith.server.constants.ce.EmailConstantsCE.PRIMARY_LINK_URL;
import static com.appsmith.server.constants.ce.EmailConstantsCE.RESET_URL;
import static com.appsmith.server.constants.ce.EmailConstantsCE.WORKSPACE_EMAIL_SUBJECT_FOR_NEW_USER;
import static graphql.Assert.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class EmailServiceCEImplTest {

    @Autowired
    TenantService tenantService;

    @Mock
    EmailSender mockEmailSender;

    private EmailServiceCE emailService;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        TenantConfiguration tenantConfiguration = new TenantConfiguration();

        Tenant tenant = tenantService.getDefaultTenant().block();
        assert tenant != null;
        tenant.setTenantConfiguration(tenantConfiguration);

        this.emailService = new EmailServiceCEImpl(mockEmailSender, tenantService);
    }

    @Test
    void sendForgotPasswordEmail() {
        String email = "test@example.com";
        String resetUrl = "http://example.com/reset";
        String originHeader = "http://example.com";

        Map<String, String> expectedParams = new HashMap<>();
        expectedParams.put(RESET_URL, resetUrl);
        expectedParams.put(INSTANCE_NAME, "Appsmith");

        doAnswer(invocation -> {
                    String to = invocation.getArgument(0);
                    String subject = invocation.getArgument(1);
                    String text = invocation.getArgument(2);
                    Map<String, String> params = invocation.getArgument(3);

                    assertEquals(email, to);
                    assertEquals(
                            String.format(FORGOT_PASSWORD_EMAIL_SUBJECT, expectedParams.get(INSTANCE_NAME)), subject);
                    assertEquals(FORGOT_PASSWORD_TEMPLATE_CE, text);
                    assertEquals(expectedParams, params);

                    return Mono.just(true);
                })
                .when(mockEmailSender)
                .sendMail(anyString(), anyString(), anyString(), anyMap());

        emailService.sendForgotPasswordEmail(email, resetUrl, originHeader).block();
    }

    @Test
    void sendInviteUserToWorkspaceEmail() {
        User invitingUser = new User();
        String invitingUserMail = "a@abc.com";
        invitingUser.setEmail(invitingUserMail);

        User invitedUser = new User();
        String invitedUserMail = "b@abc.com";
        invitedUser.setEmail(invitedUserMail);

        Workspace workspace = new Workspace();
        String workspaceName = "testWorkspace";
        String workspaceId = "testWorkspaceId";
        workspace.setName(workspaceName);
        workspace.setId(workspaceId);

        PermissionGroup permissionGroup = new PermissionGroup();
        String permissionGroupName = FieldName.ADMINISTRATOR + "role";
        permissionGroup.setName(permissionGroupName);

        boolean isNewUser = true;

        String originHeader = "http://example.com";

        Map<String, String> expectedParams = new HashMap<>();
        expectedParams.put(INVITER_WORKSPACE_NAME, workspaceName);
        expectedParams.put(INVITER_FIRST_NAME, invitingUserMail);
        expectedParams.put(FieldName.ROLE, permissionGroupName);
        expectedParams.put(INSTANCE_NAME, "Appsmith");

        doAnswer(invocation -> {
                    String to = invocation.getArgument(0);
                    String subject = invocation.getArgument(1);
                    String text = invocation.getArgument(2);
                    Map<String, String> params = invocation.getArgument(3);

                    assertEquals(invitedUser.getEmail(), to);
                    assertEquals(String.format(WORKSPACE_EMAIL_SUBJECT_FOR_NEW_USER, workspace.getName()), subject);
                    assertEquals(INVITE_WORKSPACE_TEMPLATE_CE, text);
                    assertTrue(params.containsKey(PRIMARY_LINK_URL));
                    assertTrue(params.containsKey(PRIMARY_LINK_TEXT));
                    assertEquals(expectedParams.get(INSTANCE_NAME), params.get(INSTANCE_NAME));
                    assertEquals(expectedParams.get(INVITER_WORKSPACE_NAME), params.get(INVITER_WORKSPACE_NAME));
                    assertEquals(expectedParams.get(INVITER_FIRST_NAME), params.get(INVITER_FIRST_NAME));
                    assertEquals(EMAIL_ROLE_ADMINISTRATOR_TEXT, params.get(FieldName.ROLE));

                    return Mono.just(true);
                })
                .when(mockEmailSender)
                .sendMail(anyString(), anyString(), anyString(), anyMap());

        emailService
                .sendInviteUserToWorkspaceEmail(
                        invitingUser, invitedUser, workspace, permissionGroup, originHeader, isNewUser)
                .block();
    }

    @Test
    void testSendInstanceAdminInviteEmail() {
        User invitedUser = new User();
        String invitedUserMail = "b@abc.com";
        invitedUser.setEmail(invitedUserMail);

        String originHeader = "http://example.com";

        Map<String, String> expectedParams = new HashMap<>();
        expectedParams.put(INSTANCE_NAME, "Appsmith");

        doAnswer(invocation -> {
                    String to = invocation.getArgument(0);
                    String subject = invocation.getArgument(1);
                    String text = invocation.getArgument(2);
                    Map<String, String> params = invocation.getArgument(3);

                    assertEquals(invitedUser.getEmail(), to);
                    assertEquals(
                            String.format(INSTANCE_ADMIN_INVITE_EMAIL_SUBJECT, expectedParams.get(INSTANCE_NAME)),
                            subject);
                    assertEquals(INSTANCE_ADMIN_INVITE_EMAIL_TEMPLATE, text);
                    assertTrue(params.containsKey(PRIMARY_LINK_URL));
                    assertTrue(params.containsKey(PRIMARY_LINK_TEXT));

                    return Mono.just(true);
                })
                .when(mockEmailSender)
                .sendMail(anyString(), anyString(), anyString(), anyMap());

        emailService
                .sendInstanceAdminInviteEmail(invitedUser, originHeader, true)
                .block();
    }
}
