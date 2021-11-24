package com.external.plugins;

import com.appsmith.external.dtos.MultipartFormDataDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import javax.activation.DataHandler;
import javax.activation.DataSource;
import javax.mail.AuthenticationFailedException;
import javax.mail.Authenticator;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Multipart;
import javax.mail.NoSuchProviderException;
import javax.mail.Part;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import javax.mail.util.ByteArrayDataSource;
import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormData;

public class SmtpPlugin extends BasePlugin {
    private static final String BASE64_DELIMITER = ";base64,";

    public SmtpPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Extension
    public static class SmtpPluginExecutor implements PluginExecutor<Session> {


        @Override
        public Mono<ActionExecutionResult> execute(Session connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {

            Message message = new MimeMessage(connection);
            ActionExecutionResult result = new ActionExecutionResult();
            try {
                String fromAddress = (String) getValueSafelyFromFormData(actionConfiguration.getFormData(), "send.from");
                String toAddress = (String) getValueSafelyFromFormData(actionConfiguration.getFormData(), "send.to");
                String ccAddress = (String) getValueSafelyFromFormData(actionConfiguration.getFormData(), "send.cc");
                String bccAddress = (String) getValueSafelyFromFormData(actionConfiguration.getFormData(), "send.bcc");
                String subject = (String) getValueSafelyFromFormData(actionConfiguration.getFormData(), "send.subject");
                Boolean isReplyTo = (Boolean) getValueSafelyFromFormData(actionConfiguration.getFormData(), "send.isReplyTo");
                String replyTo = Boolean.TRUE.equals(isReplyTo) ?
                        (String) getValueSafelyFromFormData(actionConfiguration.getFormData(), "send.replyTo") : null;

                if (!StringUtils.hasText(toAddress)) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "Couldn't find a valid recipient address. Please check your action configuration."));
                }
                if (!StringUtils.hasText(fromAddress)) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "Couldn't find a valid sender address. Please check your action configuration."));
                }
                message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toAddress, false));
                message.setFrom(new InternetAddress(fromAddress));

                if (StringUtils.hasText(ccAddress)) {
                    message.setRecipients(Message.RecipientType.CC, InternetAddress.parse(ccAddress, false));
                }
                if (StringUtils.hasText(bccAddress)) {
                    message.setRecipients(Message.RecipientType.BCC, InternetAddress.parse(bccAddress, false));
                }
                if (StringUtils.hasText(replyTo)) {
                    message.setReplyTo(InternetAddress.parse(replyTo, false));
                }

                message.setSubject(subject);

                String msg = StringUtils.hasText(actionConfiguration.getBody()) ? actionConfiguration.getBody() : "";

                MimeBodyPart mimeBodyPart = new MimeBodyPart();

                // By default, all emails sent will be of type HTML. This can be parameterized. For simplification reasons,
                // use the text/html mime type right now.
                mimeBodyPart.setContent(msg, "text/html");

                Multipart multipart = new MimeMultipart();
                multipart.addBodyPart(mimeBodyPart);
                message.setContent(multipart);

                // Look for any attachments that need to be sent along with this email
                String attachmentsStr = (String) getValueSafelyFromFormData(actionConfiguration.getFormData(), "send.attachments");

                if (StringUtils.hasText(attachmentsStr)) {
                    MultipartFormDataDTO[] attachmentData = objectMapper.readValue(
                            attachmentsStr,
                            MultipartFormDataDTO[].class
                    );

                    // Iterate over each attachment and add it to the main multipart body of the email
                    for (MultipartFormDataDTO attachment : attachmentData) {
                        MimeBodyPart attachBodyPart = new MimeBodyPart();

                        // Decode the base64 data received in the input by first removing the sequence data:image/png;base64,
                        // from the start of the string.
                        Base64.Decoder decoder = Base64.getDecoder();
                        String attachmentStr = String.valueOf(attachment.getData());
                        if (!attachmentStr.contains(BASE64_DELIMITER)) {
                            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                                    "Attachment " + attachment.getName() + " contains invalid data. Unable to send email."));
                        }
                        byte[] bytes = decoder.decode(attachmentStr.split(BASE64_DELIMITER)[1]);
                        DataSource emailDatasource = new ByteArrayDataSource(bytes, attachment.getType());

                        attachBodyPart.setDataHandler(new DataHandler(emailDatasource));
                        attachBodyPart.setDisposition(Part.ATTACHMENT);
                        attachBodyPart.setFileName(attachment.getName());
                        // Add the attachment body part to the multipart body
                        multipart.addBodyPart(attachBodyPart);
                    }
                }

                // Send the email now
                System.out.println("Going to send the email");
                Transport.send(message);

                result.setIsExecutionSuccess(true);
                Map<String, String> responseBody = new HashMap<>();
                responseBody.put("message", "Sent the email successfully");
                result.setBody(objectMapper.valueToTree(responseBody));

                System.out.println("Sent the email successfully");
            } catch (MessagingException e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                        "Unable to send email because of error: " + e.getMessage()));
            } catch (IOException e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                        "Unable to parse the email body/attachments because it was an invalid object."));
            }

            return Mono.just(result);
        }

        @Override
        public Mono<Session> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            Endpoint endpoint = datasourceConfiguration.getEndpoints().get(0);
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();

            Properties prop = new Properties();
            prop.put("mail.smtp.auth", true);
            prop.put("mail.smtp.starttls.enable", "true");
            prop.put("mail.smtp.host", endpoint.getHost());
            Long port = (endpoint.getPort() == null || endpoint.getPort() < 0) ? 25 : endpoint.getPort();
            prop.put("mail.smtp.port", String.valueOf(port));
            prop.put("mail.smtp.ssl.trust", endpoint.getHost());

            String username = authentication.getUsername();
            String password = authentication.getPassword();

            Session session = Session.getInstance(prop, new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(username, password);
                }
            });
            return Mono.just(session);
        }

        @Override
        public void datasourceDestroy(Session session) {
            System.out.println("Going to destroy email datasource");
            try {
                if (session != null && session.getTransport() != null) {
                    session.getTransport().close();
                }
            } catch (MessagingException e) {
                e.printStackTrace();
            }
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            System.out.println("Going to validate email datasource");
            Set<String> invalids = new HashSet<>();
            if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                invalids.add(new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                        "Could not find host address. Please edit the 'Hostname' field to provide the desired endpoint.").getMessage());
            } else {
                Endpoint endpoint = datasourceConfiguration.getEndpoints().get(0);
                if (!StringUtils.hasText(endpoint.getHost())) {
                    invalids.add(new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                            "Could not find host address. Please edit the 'Hostname' field to provide the desired endpoint.").getMessage());
                }
            }

            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            if (authentication == null || !StringUtils.hasText(authentication.getUsername()) ||
                    !StringUtils.hasText(authentication.getPassword())
            ) {
                invalids.add(new AppsmithPluginException(AppsmithPluginError.PLUGIN_AUTHENTICATION_ERROR).getMessage());
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            System.out.println("Going to test email datasource");
            Mono<Session> sessionMono = datasourceCreate(datasourceConfiguration);
            return sessionMono.map(session -> {
                Set<String> invalids = new HashSet<>();
                try {
                    Transport transport = session.getTransport();
                    if (transport != null) {
                        transport.connect();
                    }
                    return invalids;
                } catch (NoSuchProviderException e) {
                    invalids.add("Unable to create underlying SMTP protocol. Please contact support");
                } catch (AuthenticationFailedException e) {
                    invalids.add("Authentication failed with the SMTP server. Please check your username/password settings.");
                } catch (MessagingException e) {
                    e.printStackTrace();
                    invalids.add("Unable to connect to SMTP server. Please check your host/port settings.");
                }
                return invalids;
            }).map(DatasourceTestResult::new);
        }

    }
}