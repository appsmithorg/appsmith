package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public abstract class SSHCommand {

    Session session;
    Map<String, Object> responseBody = new HashMap<>();

    public SSHCommand(Session session) {
        this.session = session;
    }

    abstract public Map<String, Object> execute(ActionConfiguration actionConfiguration) throws JSchException, IOException;
}
