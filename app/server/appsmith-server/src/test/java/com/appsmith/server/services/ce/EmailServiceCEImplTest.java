package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.services.TenantService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
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
import static com.appsmith.server.constants.ce.EmailConstantsCE.INVITE_TO_WORKSPACE_EMAIL_SUBJECT_CE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.PRIMARY_LINK_TEXT;
import static com.appsmith.server.constants.ce.EmailConstantsCE.PRIMARY_LINK_URL;
import static com.appsmith.server.constants.ce.EmailConstantsCE.RESET_URL;
import static com.appsmith.server.constants.ce.EmailConstantsCE.WORKSPACE_URL;
import static graphql.Assert.assertTrue;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;

@SpringBootTest
class EmailServiceCEImplTest {

    @Autowired
    TenantService tenantService;

    @SpyBean
    EmailSender mockEmailSender;

    @Autowired
    @Qualifier("emailServiceCEImpl") private EmailServiceCE emailService;

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
                    assertThat(params).containsKey(RESET_URL);
                    assertThat(params.get(RESET_URL)).isEqualTo(resetUrl);
                    assertThat(params).containsKey(INSTANCE_NAME);
                    assertThat(params.get(INSTANCE_NAME)).isEqualTo("Appsmith");

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
                    assertEquals(String.format(INVITE_TO_WORKSPACE_EMAIL_SUBJECT_CE, workspace.getName()), subject);
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
        User invitingUser = new User();
        String invitingUserMail = "a@abc.com";
        invitingUser.setEmail(invitingUserMail);

        User invitedUser = new User();
        String invitedUserMail = "b@abc.com";
        invitedUser.setEmail(invitedUserMail);

        String originHeader = "http://example.com";

        Map<String, String> expectedParams = new HashMap<>();
        expectedParams.put(INSTANCE_NAME, "Appsmith");
        expectedParams.put(INVITER_FIRST_NAME, invitingUserMail);

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
                    assertEquals(expectedParams.get(INVITER_FIRST_NAME), params.get(INVITER_FIRST_NAME));
                    assertTrue(params.containsKey(PRIMARY_LINK_URL));
                    assertTrue(params.containsKey(PRIMARY_LINK_TEXT));

                    return Mono.just(true);
                })
                .when(mockEmailSender)
                .sendMail(anyString(), anyString(), anyString(), anyMap());

        emailService
                .sendInstanceAdminInviteEmail(invitedUser, invitingUser, originHeader, true)
                .block();
    }

    @Test
    void testInviteWorkspaceUrl() {
        String inviteUrl = "https://example.com";
        String workspaceId = "testWorkspaceId";
        assertThat(String.format(WORKSPACE_URL, inviteUrl, workspaceId))
                .isEqualTo("https://example.com/applications?workspaceId=testWorkspaceId");
    }
}
