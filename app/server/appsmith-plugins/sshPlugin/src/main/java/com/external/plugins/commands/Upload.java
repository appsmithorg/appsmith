package com.external.plugins.commands;

import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.SftpException;

import java.io.ByteArrayInputStream;
import java.util.Map;

//TODO remove
public class Upload extends SSHCommand {

    public Upload(Session session) {
        super(session);
    }

    @Override
    public Map<String, Object> execute(ActionConfiguration actionConfiguration) throws JSchException {
        ChannelSftp channel = (ChannelSftp) this.session.openChannel("sftp");

        channel.connect();
        String workDir = (String) PluginUtils.getValueSafelyFromFormData(
                actionConfiguration.getFormData(),
                "workingDirectory");

        String content = (String) PluginUtils.getValueSafelyFromFormData(
                actionConfiguration.getFormData(),
                "content");

        System.out.println(content);

        try {
            channel.mkdir(workDir);
            channel.put(new ByteArrayInputStream(content.getBytes()), "fileName");
        } catch (SftpException e) {
            e.printStackTrace();
        }

        responseBody.put("response", "success");
        responseBody.put("exitCode", channel.getExitStatus());

        return responseBody;
    }
}
