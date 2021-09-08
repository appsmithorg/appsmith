package com.appsmith.external.git;

import java.io.IOException;

public interface GitExecutor {
    String CheckConnection(String remoteUrl, String sshKey ) throws IOException;
}
