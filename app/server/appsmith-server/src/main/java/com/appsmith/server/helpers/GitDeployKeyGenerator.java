package com.appsmith.server.helpers;

import com.appsmith.git.helpers.StringOutputStream;
import com.appsmith.server.constants.Assets;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.dtos.GitDeployKeyDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.KeyPair;
import org.apache.commons.lang.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.reflections.Reflections.log;

public class GitDeployKeyGenerator {
    public enum supportedProtocols {
        ECDSA(256, ""),
        RSA(4096, "Azure Devops");

        private final Integer key_size;

        private final String supportedPlatforms;

        supportedProtocols(int key_size, String supportedPlatForms) {
            this.key_size = key_size;
            this.supportedPlatforms = supportedPlatForms;
        }

        public GitDeployKeyDTO getProtocolDetails() {
            GitDeployKeyDTO gitDeployKeyDTO = new GitDeployKeyDTO();
            gitDeployKeyDTO.setProtocolName(this.name());
            gitDeployKeyDTO.setKeySize(this.key_size);
            gitDeployKeyDTO.setPlatFormSupported(this.supportedPlatforms);
            return gitDeployKeyDTO;
        }

    }

    public static GitAuth generateSSHKey(String keyType) {
        JSch jsch = new JSch();
        KeyPair kpair;
        int key;
        int keySize;
        if(!StringUtils.isEmpty(keyType) && keyType.equals(supportedProtocols.RSA.name())) {
            key = KeyPair.RSA;
            keySize = supportedProtocols.RSA.key_size;
        } else {
            key = KeyPair.ECDSA;
            keySize = supportedProtocols.ECDSA.key_size;
        }

        try {
            kpair = KeyPair.genKeyPair(jsch, key, keySize);
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

    public static List<GitDeployKeyDTO> getSupportedProtocols() {
        List<GitDeployKeyDTO> protocolList = new ArrayList<>();
        protocolList.add(supportedProtocols.ECDSA.getProtocolDetails());
        protocolList.add(supportedProtocols.RSA.getProtocolDetails());
        return protocolList;
    }
}
