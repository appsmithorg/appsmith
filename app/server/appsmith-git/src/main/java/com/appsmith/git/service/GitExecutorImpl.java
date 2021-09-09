package com.appsmith.git.service;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.helpers.SshTransportConfigCallback;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.TransportConfigCallback;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.TransportException;
import org.springframework.beans.factory.annotation.Value;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

public class GitExecutorImpl implements GitExecutor {

    @Value("${appsmith.git.root:./container-volumes/git-storage}")
    private String gitRootPath;

    private static final String PVT_KEY_STRING = "-----BEGIN RSA PRIVATE KEY-----\n" +
            "MIICXQIBAAKBgQCKu1WRvholQC+0AfBvphY+ha2KDhcYtqwOYy2xaCqCQAFK5HbW\n" +
            "PVaPiEilS2O1as/MaA79z+g8I04LSKKvVDz/9VciCIPKkVrdueyNaD+CyWXOqenG\n" +
            "dfQMHejUWOK2Yqgzx8aE1/C1wr1H7YP2tllvehki5zYlZJAr0sIy6bo+7QIDAQAB\n" +
            "AoGAZSbB9UnOdmqeXXksfbtzbJK7PXWYkYRfXv4hSsDQfbd9OcXqf7qpam3Lyfl1\n" +
            "8ci3Sip1A8qbYX28Ya3MMFoTPtjnDORyGuD7EHQfpqjyVs2IU2yQQVm6mLY59WMY\n" +
            "uGX/MlwyH+5GWz4PcUduEQ5vOi6GfBJcOI/qApp4CNo1HwECQQDPbEslKD3E/7Co\n" +
            "4AYR96SXa+nT4KFa5gHubDX3l/gIwAdzEBSFZwWP8GLPNiiU3uwFvL5VLbVMQrPV\n" +
            "TRqJRT+5AkEAqzjFFSpvxA1r0TsELwQbvgC/DPZBS++5muvc15gsCR5uces4N5af\n" +
            "rIHPAkb86MYdShkL7rGWu2mHOVxj7RcK1QJBALtvqsAbCyZ3v9X7CsE1vYAvvg7+\n" +
            "0BBqBJjFJEdnBnYxwQmTIFgkbnxRx5hj4mwUvce5dW1XbptJM2Su1inxb9ECQHwl\n" +
            "N1C3aj4+dPRJ1Ci609qZ8+xUCNgkQvE/Hur7HMKn2/ChWiuD/NY5cHz4N5wXOVlm\n" +
            "e65f+Sh9xVwjzxgy4tkCQQCy/F1L0YOzzWbaAALvMlnGA260FVTZOQSdursqv5qr\n" +
            "dpXpgz8U8ZRSAlOfd9nTgX3KdfIETWxtRfuBBejjFIno\n" +
            "-----END RSA PRIVATE KEY-----";
    private static final String PUB_KEY_STRING = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAgQCKu1WRvholQC+0AfBvphY+ha2KDhcYtqwOYy2xaCqCQAFK5HbWPVaPiEilS2O1as/MaA79z+g8I04LSKKvVDz/9VciCIPKkVrdueyNaD+CyWXOqenGdfQMHejUWOK2Yqgzx8aE1/C1wr1H7YP2tllvehki5zYlZJAr0sIy6bo+7Q== appsmith";

    @Override
    public boolean cloneApp(String repoPath, String remoteUrl, String privateSshKey, String publicSshKey) {
        File file = getFilePath(repoPath);
        final TransportConfigCallback transportConfigCallback = new SshTransportConfigCallback(PUB_KEY_STRING, PVT_KEY_STRING);
        try(Git result = Git.cloneRepository()
                .setURI(remoteUrl)
                .setTransportConfigCallback(transportConfigCallback)
                .setDirectory(file)
                .call()) {
            return true;
        } catch (InvalidRemoteException e) {
            e.printStackTrace();
        } catch (TransportException e) {
            e.printStackTrace();
        } catch (GitAPIException e) {
            e.printStackTrace();
        }
        return false;
    }

    /* There might be a case where the name conflicts can occur while creating the file.
    *  This function creates the directory and handles the name conflicts by appending the number to the repoName
    *  @param repoPath - combination of orgId, defaultApplicationId
    *  @param repoName - the git repo name
    *  @return file reference. Folder created Ex - gitRootPath/orgId/defaultApplicationId/repoName
    * */
    private File getFilePath(String repoPath) {
        Path filePath = Paths.get(gitRootPath,repoPath);
        File file = new File(String.valueOf(filePath));
        if(!file.exists()) {
            file.mkdir();
            return file;
        }

        /*
        //if the directory with same exists, append the number at the end of the name until the proper name is found
        int i = 1;
        String currentName = repoName;
        filePath = Paths.get(gitRootPath,repoPath);
        while(file.exists()) {
            currentName = repoName + "(" + i + ")" ;
            file =  new File(filePath + "/" + currentName + "/");
            i = i + 1;
        }*/
        return file;
    }
}
