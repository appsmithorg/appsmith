package com.appsmith.external.helpers;

import com.appsmith.external.models.ConnectionContext;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSHConnection;
import net.schmizz.sshj.SSHClient;
import net.schmizz.sshj.userauth.keyprovider.PKCS8KeyFile;
import org.bouncycastle.asn1.pkcs.RSAPrivateKey;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.Reader;
import java.io.StringReader;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Security;
import java.security.interfaces.RSAPrivateCrtKey;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import static com.appsmith.external.helpers.SSHUtils.getConnectionContext;
import static com.appsmith.external.helpers.SSHUtils.getDBPortFromConfigOrDefault;
import static com.appsmith.external.helpers.SSHUtils.getSSHPortFromConfigOrDefault;
import static com.appsmith.external.helpers.SSHUtils.isSSHEnabled;
import static com.appsmith.external.helpers.SSHUtils.isSSHTunnelConnected;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class SSHUtilsTest {

    @BeforeAll
    static void setup() {
        Security.addProvider(
                new BouncyCastleProvider()); // Ensure BouncyCastle algorithms are registered for key parsing
    }

    /* Test PKCS#8 PEM Key Parsing */
    @Test
    public void testPKCS8PEMKeyParsing() throws Exception {
        KeyPair keyPair = generateRsaKeyPair();
        String pkcs8Key = toPkcs8Pem(keyPair);

        Reader reader = new StringReader(pkcs8Key);
        PKCS8KeyFile pkcs8KeyFile = new PKCS8KeyFile();
        pkcs8KeyFile.init(reader);

        assertNotNull(pkcs8KeyFile);
    }

    /* Test RSA PEM Key Parsing */
    @Test
    public void testRSAPEMKeyParsing() throws Exception {
        KeyPair keyPair = generateRsaKeyPair();
        String rsaPkcs1 = toPkcs1Pem((RSAPrivateCrtKey) keyPair.getPrivate());

        String convertedKey = SSHUtils.convertRsaPkcs1ToPkcs8(rsaPkcs1);

        Reader reader = new StringReader(convertedKey);
        PKCS8KeyFile pkcs8KeyFile = new PKCS8KeyFile();
        pkcs8KeyFile.init(reader);

        assertNotNull(pkcs8KeyFile);
        assertTrue(convertedKey.contains("BEGIN PRIVATE KEY"));
    }

    /* Test is ssh enabled method */
    @Test
    public void testIsSSHEnabled_trueCase() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null);
        properties.add(new Property("Connection method", "SSH"));
        datasourceConfiguration.setProperties(properties);
        assertTrue(
                isSSHEnabled(datasourceConfiguration, 1),
                datasourceConfiguration.getProperties().toString());
    }

    /* Test is ssh disabled method */
    @Test
    public void testIsSSHEnabled_falseCase() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null);
        properties.add(new Property("Connection method", "Standard"));
        datasourceConfiguration.setProperties(properties);
        assertFalse(
                isSSHEnabled(datasourceConfiguration, 1),
                datasourceConfiguration.getProperties().toString());
    }

    /* Test is ssh connected when all objects return expected values */
    @Test
    public void testIsSSHConnected_withAllTruthyValues() {
        SSHClient mockSSHClient = mock(SSHClient.class);
        when(mockSSHClient.isConnected()).thenReturn(true);
        when(mockSSHClient.isAuthenticated()).thenReturn(true);
        SSHTunnelContext sshTunnelContext = new SSHTunnelContext(null, null, mockSSHClient);
        assertTrue(isSSHTunnelConnected(sshTunnelContext));
    }

    /* Test is ssh connected when authentication has failed */
    @Test
    public void testIsSSHConnected_withAuthFailure() {
        SSHClient mockSSHClient = mock(SSHClient.class);
        when(mockSSHClient.isConnected()).thenReturn(true);
        when(mockSSHClient.isAuthenticated()).thenReturn(false);
        SSHTunnelContext sshTunnelContext = new SSHTunnelContext(null, null, mockSSHClient);
        assertFalse(isSSHTunnelConnected(sshTunnelContext));
    }

    /* Test is ssh connected when connection has failed */
    @Test
    public void testIsSSHConnected_withConnectionFailure() {
        SSHClient mockSSHClient = mock(SSHClient.class);
        when(mockSSHClient.isConnected()).thenReturn(false);
        when(mockSSHClient.isAuthenticated()).thenReturn(true);
        SSHTunnelContext sshTunnelContext = new SSHTunnelContext(null, null, mockSSHClient);
        assertFalse(isSSHTunnelConnected(sshTunnelContext));
    }

    /* Test is ssh connected when ssh client is null */
    @Test
    public void testIsSSHConnected_whenSSHClientIsNull() {
        SSHTunnelContext sshTunnelContext = new SSHTunnelContext(null, null, null);
        assertFalse(isSSHTunnelConnected(sshTunnelContext));
    }

    /* Test get connection context */
    @Test
    public void testGetConnectionContext_whenSSHIsDisabled() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();

        /* Set connection method toggle to non-SSH value e.g. Standard */
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null);
        properties.add(new Property("Connection method", "Standard"));
        datasourceConfiguration.setProperties(properties);

        ConnectionContext connectionContext = getConnectionContext(datasourceConfiguration, 1, null, Object.class);
        assertTrue(connectionContext.getConnection() == null, connectionContext.toString());
        assertTrue(connectionContext.getSshTunnelContext() == null, connectionContext.toString());
    }

    @Test
    public void testDefaultSSHPortValue() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setSshProxy(new SSHConnection()); // port number not provided

        assertEquals(getSSHPortFromConfigOrDefault(datasourceConfiguration), 22L);
    }

    @Test
    public void testDefaultDBPortValue() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(List.of(new Endpoint()));

        assertEquals(getDBPortFromConfigOrDefault(datasourceConfiguration, 1234L), 1234L);
    }

    private KeyPair generateRsaKeyPair() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(1024);
        return generator.generateKeyPair();
    }

    private String toPkcs8Pem(KeyPair keyPair) {
        byte[] pkcs8Bytes = keyPair.getPrivate().getEncoded();
        return formatPem("PRIVATE KEY", pkcs8Bytes);
    }

    private String toPkcs1Pem(RSAPrivateCrtKey privateKey) throws IOException {
        RSAPrivateKey bcPrivateKey = new RSAPrivateKey(
                privateKey.getModulus(),
                privateKey.getPublicExponent(),
                privateKey.getPrivateExponent(),
                privateKey.getPrimeP(),
                privateKey.getPrimeQ(),
                privateKey.getPrimeExponentP(),
                privateKey.getPrimeExponentQ(),
                privateKey.getCrtCoefficient());

        return formatPem("RSA PRIVATE KEY", bcPrivateKey.getEncoded());
    }

    private String formatPem(String header, byte[] encodedBytes) {
        String base64 = Base64.getMimeEncoder(64, new byte[] {'\n'}).encodeToString(encodedBytes);
        return "-----BEGIN " + header + "-----\n" + base64 + "\n-----END " + header + "-----\n";
    }
}
