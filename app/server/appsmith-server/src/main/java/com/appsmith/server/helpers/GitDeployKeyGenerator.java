package com.appsmith.server.helpers;

import com.appsmith.git.helpers.StringOutputStream;
import com.appsmith.server.constants.Assets;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.KeyPair;

import java.time.Instant;

import static org.reflections.Reflections.log;

public class GitDeployKeyGenerator {

    public static GitAuth generateSSHKey() {
        JSch jsch = new JSch();
        KeyPair kpair;

        try {
            kpair = KeyPair.genKeyPair(jsch, KeyPair.ECDSA, 256);
        } catch (JSchException e) {
            log.error("failed to generate ECDSA key pair", e);
            throw new AppsmithException(AppsmithError.SSH_KEY_GENERATION_ERROR);
        }

        StringOutputStream privateKeyOutput = new StringOutputStream();
        StringOutputStream publicKeyOutput = new StringOutputStream();

        kpair.writePrivateKey(privateKeyOutput);
        kpair.writePublicKey(publicKeyOutput, "appsmith");

        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey(publicKeyOutput.toString());
        gitAuth.setPrivateKey(privateKeyOutput.toString());
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl(Assets.GIT_DEPLOY_KEY_DOC_URL);

        return gitAuth;
    }
}
