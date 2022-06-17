const cp = require("child_process");

exports.cleanTheHost = async () => {
  await cp.exec("pidof chrome", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`Killing chrome processes: ${stdout}`);
    stdout.split(" ").forEach((PID) => {
      cp.exec(`kill -9 ${PID}`, (error, stdout, stder) => {
        if (error) {
          console.log(`Kill error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`Kill stderr: ${stderr}`);
          return;
        }
        if (stdout) {
          console.log(`Kill stdout: ${stdout}`);
          return;
        }
      });
    });
  });

  // Clear OS caches
  await cp.exec("sync; echo 3 | sudo tee /proc/sys/vm/drop_caches");
};

exports.setChromeProcessPriority = async () => {
  await cp.exec("pidof chrome", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: setting priority: ${stdout}`);

    // Set priority of chrome processes to maximum
    stdout.split(" ").forEach((PID) => {
      cp.execSync(`renice -20 ${PID}`);
    });
  });
};
