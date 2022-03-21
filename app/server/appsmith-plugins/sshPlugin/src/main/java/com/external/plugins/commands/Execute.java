package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

public class Execute extends SSHCommand {

    public Execute(Session session) {
        super(session);
    }

    @Override
    public Map<String, Object> execute(ActionConfiguration actionConfiguration) throws JSchException, IOException {

        ChannelExec channel = (ChannelExec) this.session.openChannel("exec");
        channel.setCommand(actionConfiguration.getBody());
        StringBuilder outputBuffer = new StringBuilder();
        ByteArrayOutputStream errorStream = new ByteArrayOutputStream();

        channel.setErrStream(errorStream);
        channel.connect();

        // Read the response stream till we reach the end character
        InputStream inputStream = channel.getInputStream();

        int readByte = inputStream.read();

        // Read the stream till the EOF character is encountered
        while (readByte != 0xffffffff) {
            outputBuffer.append((char) readByte);
            readByte = inputStream.read();
        }

        // If data is present in the errorStream, then set the errorStream. Else, set the response to
        // outputBuffer.
        String responseString = (errorStream.size() > 0) ? errorStream.toString() : outputBuffer.toString();
        responseBody.put("response", responseString);
        responseBody.put("exitCode", channel.getExitStatus());

        return responseBody;
    }
}
