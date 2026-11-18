package com.external.plugins.utils;

import org.apache.kerby.kerberos.kerb.server.SimpleKdcServer;
import org.apache.kerby.util.NetworkUtil;

import java.io.File;

/**
 * A real Kerberos server (Apache Kerby) for tests, with one user account and one SQL Server service account.
 *
 * <p>It points the JVM-wide {@code java.security.krb5.conf} setting at its own krb5.conf. Kerby also changes that
 * setting while it starts, so the original value is saved before Kerby starts, and put back by {@link #close()}.
 */
public final class MssqlKerberosTestKdc implements AutoCloseable {

    public static final String REALM = "APPSMITH.TEST";
    public static final String USER = "svc_appsmith@" + REALM;
    public static final String PASSWORD = "correct-horse-battery";
    public static final String SERVICE = "MSSQLSvc/sql.appsmith.test:1433@" + REALM;

    private static final String KRB5_CONF_PROPERTY = "java.security.krb5.conf";

    private final SimpleKdcServer server;
    private final String previousKrb5Conf;

    private MssqlKerberosTestKdc(SimpleKdcServer server, String previousKrb5Conf) {
        this.server = server;
        this.previousKrb5Conf = previousKrb5Conf;
    }

    /** Starts a Kerberos server on a free TCP port, writing its files into {@code dir}. */
    public static MssqlKerberosTestKdc start(File dir) throws Exception {
        String previousKrb5Conf = System.getProperty(KRB5_CONF_PROPERTY);
        SimpleKdcServer server = new SimpleKdcServer();
        try {
            server.setWorkDir(dir);
            server.setKdcHost("localhost");
            server.setKdcRealm(REALM);
            server.setAllowUdp(false);
            server.setAllowTcp(true);
            server.setKdcTcpPort(NetworkUtil.getServerPort());
            server.init();
            server.start();
            server.createPrincipal(USER, PASSWORD);
            server.createPrincipal(SERVICE, "service-key-password");
            // MssqlKerberosLogin sets refreshKrb5Config, so the next login reads this file.
            System.setProperty(KRB5_CONF_PROPERTY, new File(dir, "krb5.conf").getAbsolutePath());
            return new MssqlKerberosTestKdc(server, previousKrb5Conf);
        } catch (Exception e) {
            restore(previousKrb5Conf);
            throw e;
        }
    }

    @Override
    public void close() throws Exception {
        try {
            server.stop();
        } finally {
            restore(previousKrb5Conf);
        }
    }

    private static void restore(String previousKrb5Conf) {
        if (previousKrb5Conf == null) {
            System.clearProperty(KRB5_CONF_PROPERTY);
        } else {
            System.setProperty(KRB5_CONF_PROPERTY, previousKrb5Conf);
        }
    }
}
