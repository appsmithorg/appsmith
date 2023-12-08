package com.appsmith.server;

import org.junit.jupiter.api.extension.AfterAllCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestWatcher;

import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * The TestWatcher interface is used to react to the execution of tests.
 * Here, we record failed tests to a file so that in CI, we can re-run just the failed tests instead of all the tests.
 * In the future, we can also use this extension to record timing, etc.
 *
 * The extension is registered for all JUnit tests via the files: appsmith-server/src/test/resources/junit-platform.properties
 * and appsmith-server/src/test/META-INF/services/org.junit.jupiter.api.extension.Extension
 *
 */
public class TestResultLoggerExtension implements TestWatcher, AfterAllCallback {

    private final List<String> failedTests = new ArrayList<>();

    /**
     * This method is called after all the tests are run. It writes the failed tests to a file.
     *
     * @param context
     * @throws Exception
     */
    @Override
    public void afterAll(ExtensionContext context) throws Exception {
        if (failedTests.isEmpty()) {
            return;
        }
        String failedTestsStr = String.join("\n", failedTests);

        String defaultTestResultFile = "failedServerTests.txt";
        // In order to change the file name, run the command: mvn test -DtestResultFile=<filename>
        String fileName = System.getProperty("testResultFile", defaultTestResultFile);
        System.out.println("Going to write failed test results to file name: " + fileName);
        writeLine(failedTestsStr, fileName);
    }

    /**
     * This method is called when a test fails. It adds the failed test to a list in-memory.
     *
     * @param context
     * @param cause
     */
    @Override
    public void testFailed(ExtensionContext context, Throwable cause) {
        String testClass = context.getTestClass().get().getName();

        // Remove the function parenthesis () from the end of the test method name because context.getDisplayName()
        // returns
        // the test method name with parenthesis at the end.
        String testMethod =
                context.getDisplayName().substring(0, context.getDisplayName().length() - 2);
        failedTests.add(testClass + "#" + testMethod);
    }

    /**
     * This method writes the failed tests to a file. If the file does not exist, it creates a new file.
     *
     * @param value    The value to be written to the file.
     * @param filepath The path of the file to which the value is to be written.
     * @throws IOException
     */
    private void writeLine(final String value, final String filepath) throws IOException {
        try (FileWriter fileWriter = new FileWriter(filepath, true)) {
            fileWriter.append(value);
            fileWriter.append("\n");
            fileWriter.flush();
        }
    }
}
