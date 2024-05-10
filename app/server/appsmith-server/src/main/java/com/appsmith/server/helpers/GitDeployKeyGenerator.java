package com.appsmith.server.helpers;

import com.appsmith.server.constants.Assets;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.dtos.GitDeployKeyDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.bouncycastle.crypto.params.AsymmetricKeyParameter;
import org.bouncycastle.crypto.util.OpenSSHPublicKeyUtil;
import org.bouncycastle.crypto.util.PublicKeyFactory;

import java.io.IOException;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.PublicKey;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import static com.appsmith.external.git.constants.SSHConstants.ECDSA_KEY_FACTORY_IDENTIFIER;
import static com.appsmith.external.git.constants.SSHConstants.ECDSA_TYPE_PREFIX;
import static com.appsmith.external.git.constants.SSHConstants.RSA_KEY_FACTORY_IDENTIFIER;
import static com.appsmith.external.git.constants.SSHConstants.RSA_TYPE_PREFIX;

@Slf4j
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
        String alg;
        int keySize;
        KeyPair keyPair;
        String publicKey;

        try {
            if (!StringUtils.isEmpty(keyType) && keyType.equals(supportedProtocols.RSA.name())) {
                alg = RSA_KEY_FACTORY_IDENTIFIER;
                keySize = supportedProtocols.RSA.key_size;
                keyPair = getKeyPair(alg, keySize);
                publicKey = writeJavaPublicKeyToSSH2(keyPair.getPublic(), RSA_TYPE_PREFIX);
            } else {
                alg = ECDSA_KEY_FACTORY_IDENTIFIER;
                keySize = supportedProtocols.ECDSA.key_size;
                keyPair = getKeyPair(alg, keySize);
                publicKey = writeJavaPublicKeyToSSH2(keyPair.getPublic(), ECDSA_TYPE_PREFIX);
            }
        } catch (NoSuchAlgorithmException | IOException e) {
            log.debug("Error while creating key pair", e);
            throw new AppsmithException(AppsmithError.SSH_KEY_GENERATION_ERROR, e);
        }

        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey(publicKey);
        byte[] encodedPrivateKey = keyPair.getPrivate().getEncoded();
        gitAuth.setPrivateKey(Base64.getEncoder().encodeToString(encodedPrivateKey));
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl(Assets.GIT_DEPLOY_KEY_DOC_URL);

        return gitAuth;
    }

    private static KeyPair getKeyPair(String alg, int keySize) throws NoSuchAlgorithmException {
        KeyPair keyPair;
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(alg);
        keyPairGenerator.initialize(keySize);
        keyPair = keyPairGenerator.generateKeyPair();

        return keyPair;
    }

    public static List<GitDeployKeyDTO> getSupportedProtocols() {
        List<GitDeployKeyDTO> protocolList = new ArrayList<>();
        protocolList.add(supportedProtocols.ECDSA.getProtocolDetails());
        protocolList.add(supportedProtocols.RSA.getProtocolDetails());
        return protocolList;
    }

    private static String writeJavaPublicKeyToSSH2(final PublicKey publicKey, String prefix) throws IOException {
        AsymmetricKeyParameter key = PublicKeyFactory.createKey(publicKey.getEncoded());
        final byte[] sshKey = OpenSSHPublicKeyUtil.encodePublicKey(key);
        return prefix + Base64.getEncoder().encodeToString(sshKey) + " appsmith";
    }
}
