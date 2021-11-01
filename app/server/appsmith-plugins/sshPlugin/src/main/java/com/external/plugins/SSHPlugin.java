package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.SSHAuth;
import com.appsmith.external.models.SSHConnection;
import com.appsmith.external.models.SSHPrivateKey;
import com.appsmith.external.models.UploadedFile;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.models.SSHAuth.AuthType.IDENTITY_FILE;
import static com.appsmith.external.models.SSHAuth.AuthType.PASSWORD;

//TODOS:
//1. Add more unit tests for validate datasource
//2. Add some commonly used commands to the dropdown
//4. Add fallback condition for key-based login to use Appsmith's private key (Maybe)

// SMTP Plugin
//1. Correct the plugin type in DBChangelog
//2. Change response object sent to client via objectMapper.valueToTree(obj)
public class SSHPlugin extends BasePlugin {

    public SSHPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class SSHPluginExecutor implements PluginExecutor<Session> {

        @Override
        public Mono<ActionExecutionResult> execute(Session session,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {
            ActionExecutionResult result = new ActionExecutionResult();
            try {
                ChannelExec channel = (ChannelExec) session.openChannel("exec");
                channel.setCommand(actionConfiguration.getBody());
                StringBuilder outputBuffer = new StringBuilder();
                ByteArrayOutputStream responseStream = new ByteArrayOutputStream();

                channel.setErrStream(responseStream);
                channel.connect();

                // Read the response stream till we reach the end character
                InputStream inputStream = channel.getInputStream();

                int readByte = inputStream.read();
                while (readByte != 0xffffffff) {
                    outputBuffer.append((char) readByte);
                    readByte = inputStream.read();
                }

                String responseString;
                if (responseStream.size() > 0) {
                    responseString = responseStream.toString();
                } else {
                    responseString = outputBuffer.toString();
                }

                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("response", responseString);
                responseBody.put("exitCode", channel.getExitStatus());
                result.setBody(objectMapper.valueToTree(responseBody));
                result.setIsExecutionSuccess(channel.getExitStatus() == 0);
                System.out.println("Executed the SSH command successfully");
            } catch (JSchException | IOException e) {
                e.printStackTrace();
                result.setBody(AppsmithPluginError.PLUGIN_ERROR.getMessage("Error while executing SSH command. Cause: " + e.getMessage()));
                result.setIsExecutionSuccess(false);
            }
            return Mono.just(result);
        }

        @Override
        public Mono<Session> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            Session session;
            try {
                JSch jSch = new JSch();

                Endpoint endpoint = datasourceConfiguration.getEndpoints().get(0);
                SSHAuth authentication = (SSHAuth) datasourceConfiguration.getAuthentication();
                SSHConnection sshConnection = datasourceConfiguration.getSshProxy();
                String username = authentication.getUsername();
                session = jSch.getSession(username, endpoint.getHost(), endpoint.getPort().intValue());

                // Disable host key checking because the servers may change against the same IP. We don't want users to
                // verify each time an SSH action is executed.
                session.setConfig("StrictHostKeyChecking", "no");

                switch (authentication.getAuthType()) {
                    case PASSWORD:
                        session.setPassword(authentication.getPassword());
                        break;
                    case IDENTITY_FILE: {
                        SSHPrivateKey privateKey = authentication.getPrivateKey();
                        UploadedFile privateKeyFile = privateKey.getKeyFile();
                        String privateKeyName = privateKeyFile.getName();
                        byte[] privateKeyBytes = privateKeyFile.getDecodedContent();
                        byte[] privateKeyPassphrase = StringUtils.hasText(privateKey.getPassphrase()) ?
                                privateKey.getPassphrase().getBytes() : null;
                        jSch.addIdentity(privateKeyName, privateKeyBytes, null, privateKeyPassphrase);
                        break;
                    }
                    default:
                        return Mono.error(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Invalid authentication type provided")
                        );
                }

                System.out.println("Going to connect DS");
                session.connect();
                System.out.println("Started session");

                return Mono.just(session);
            } catch (JSchException e) {
                e.printStackTrace();
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Error while creating the datasource. Cause: " + e.getMessage()
                ));
            }
        }

        @Override
        public void datasourceDestroy(Session session) {
            System.out.println("Destroying the SSH connection");
            session.disconnect();
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();

            SSHAuth sshAuth = (SSHAuth) datasourceConfiguration.getAuthentication();
            if (sshAuth == null) {
                invalids.add(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                        "Invalid SSH connection object received.").getMessage()
                );
            } else {
                List<Endpoint> endpoints = datasourceConfiguration.getEndpoints();
                if (endpoints != null && !endpoints.isEmpty()) {
                    Endpoint endpoint = endpoints.get(0);
                    if (!StringUtils.hasText(endpoint.getHost())) {
                        invalids.add(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                "Mandatory parameter hostname is missing or empty").getMessage());
                    }
                    if (endpoint.getPort() == null || endpoint.getPort() <= 0) {
                        invalids.add(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                "Mandatory parameter port is either missing or invalid").getMessage());
                    }
                }
                if (!StringUtils.hasText(sshAuth.getUsername())) {
                    invalids.add(new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                            "Mandatory parameter username is missing or empty").getMessage());
                }
                if (sshAuth.getAuthType() == null) {
                    invalids.add(new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                            "Mandatory parameter authentication type is missing").getMessage());
                } else {
                    if (PASSWORD.equals(sshAuth.getAuthType()) && sshAuth.getPassword() == null) {
                        invalids.add(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                "Mandatory parameter password is missing").getMessage());
                    }
                    if (IDENTITY_FILE.equals(sshAuth.getAuthType()) &&
                            (sshAuth.getPrivateKey() == null ||
                              sshAuth.getPrivateKey().getKeyFile() == null ||
                              !StringUtils.hasText(sshAuth.getPrivateKey().getKeyFile().getBase64Content()))) {
                        invalids.add(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                "Mandatory parameter private key file is missing").getMessage());
                    }
                }
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return datasourceCreate(datasourceConfiguration)
                    .map(session -> {
                        datasourceDestroy(session);
                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())));
        }
    }
}
