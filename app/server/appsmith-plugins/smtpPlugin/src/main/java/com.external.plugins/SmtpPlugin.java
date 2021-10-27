package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import javax.mail.Authenticator;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Multipart;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.AddressException;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import java.util.HashSet;
import java.util.Properties;
import java.util.Set;

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormData;

public class SmtpPlugin extends BasePlugin {
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
                String fromAddress = (String) getValueSafelyFromFormData(actionConfiguration.getFormData(), "from");
                String toAddress = (String) getValueSafelyFromFormData(actionConfiguration.getFormData(),"to");
                String ccAddress = (String) getValueSafelyFromFormData(actionConfiguration.getFormData(),"cc");
                String bccAddress = (String) getValueSafelyFromFormData(actionConfiguration.getFormData(),"bcc");
                String subject = (String) getValueSafelyFromFormData(actionConfiguration.getFormData(),"subject");
                String replyTo = (Boolean) getValueSafelyFromFormData(actionConfiguration.getFormData(),"isReplyTo") ?
                        (String) getValueSafelyFromFormData(actionConfiguration.getFormData(),"replyTo") : null;

                if (!StringUtils.hasText(toAddress)) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "Couldn't find a valid recipient address. Please check your action configuration."));
                }
                if (!StringUtils.hasText(fromAddress)) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "Couldn't find a valid sender address. Please check your action configuration."));
                }
                message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toAddress));
                message.setFrom(new InternetAddress(fromAddress));

                if (StringUtils.hasText(ccAddress)) {
                    message.setRecipients(Message.RecipientType.CC, InternetAddress.parse(ccAddress));
                }
                if (StringUtils.hasText(bccAddress)) {
                    message.setRecipients(Message.RecipientType.BCC, InternetAddress.parse(bccAddress));
                }
                if (StringUtils.hasText(replyTo)) {
                    message.setReplyTo(InternetAddress.parse(replyTo));
                }

                message.setSubject(subject);

                String msg = StringUtils.hasText(actionConfiguration.getBody()) ? actionConfiguration.getBody() : "";

                MimeBodyPart mimeBodyPart = new MimeBodyPart();
                mimeBodyPart.setContent(msg, "text/html");

                Multipart multipart = new MimeMultipart();
                multipart.addBodyPart(mimeBodyPart);
                message.setContent(multipart);

                System.out.println("Going to send the email");
                Transport.send(message);
                result.setIsExecutionSuccess(true);
                result.setBody("Sent email successfully");
            } catch(AddressException e) {
                e.printStackTrace();
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                        "Unable to " + e.getMessage()));
            } catch (MessagingException e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                        "Unable to send email because of error: " + e.getMessage()));
            }

            return Mono.just(result);
        }

        @Override
        public Mono<Session> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            Endpoint endpoint = datasourceConfiguration.getEndpoints().get(0);
            BasicAuth authentication = (BasicAuth) datasourceConfiguration.getAuthentication();

            Properties prop = new Properties();
            prop.put("mail.smtp.auth", true);
            prop.put("mail.smtp.starttls.enable", "false");
            prop.put("mail.smtp.host", endpoint.getHost());
            prop.put("mail.smtp.port", String.valueOf(endpoint.getPort()));
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
        public void datasourceDestroy(Session connection) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Please implement");
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();
            if (datasourceConfiguration.getEndpoints() == null ||
                    datasourceConfiguration.getEndpoints().isEmpty() ||
                    datasourceConfiguration.getEndpoints().get(0) == null
            ) {
                invalids.add(new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                        "Could not find host address. Please edit the 'Hostname' field to provide the desired endpoint.").getMessage());
            } else {
                Endpoint endpoint = datasourceConfiguration.getEndpoints().get(0);
                if (!StringUtils.hasText(endpoint.getHost())) {
                    invalids.add(new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                            "Could not find host address. Please edit the 'Hostname' field to provide the desired endpoint.").getMessage());
                }
                if (endpoint.getPort() == null) {
                    invalids.add(new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                            "Could not find port. Please edit the 'Port' field to provide the desired endpoint.").getMessage());
                }
            }

            BasicAuth authentication = (BasicAuth) datasourceConfiguration.getAuthentication();
            if (authentication == null || !StringUtils.hasText(authentication.getUsername()) ||
                    !StringUtils.hasText(authentication.getPassword())
            ) {
                invalids.add(new AppsmithPluginException(AppsmithPluginError.PLUGIN_AUTHENTICATION_ERROR).getMessage());
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Please implement"));
        }

        @Override
        public Mono<DatasourceStructure> getStructure(Session connection, DatasourceConfiguration datasourceConfiguration) {
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Please implement"));
        }
    }
}