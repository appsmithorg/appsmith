const shell = require('shelljs');
const process = require('process');
const export_db = require('./export_db.js');
const readlineSync = require('readline-sync');

const main = async (userServer, ipServer) => {
  shell.echo('Check connection to server');
  const resultNc = shell.exec(`nc -vzw 5 ${ipServer} 22`);

  if (!resultNc.stderr.includes('succeeded')) {
    shell.echo("********* Can't connection to server destination ********");
    shell.echo('***** Please check connection to server destination *****');
    process.kill(process.pid);
  }

  shell.echo('**************************** WARNING ****************************');
  shell.echo('  This process will stop application. Do you want to continue?  ');
  const answerConfirm = readlineSync.question('Type "y" if you agree, type "c" to cancel: ');

  if (answerConfirm.toLowerCase() === 'y') {
    const folderSsh = `/opt/appsmith/.ssh`;
    const isCreatedKey = await generationKey(folderSsh);
    if (isCreatedKey) {
      shell.echo('****** Run below command on the new server to add key for migration *******\n');
      shell.echo(`echo "${shell.cat(`${folderSsh}/id_rsa.pub`).stdout.replace(' \n', '')}" >> ~/.ssh/authorized_keys`);
      shell.echo();
    }

    const answerKey = readlineSync.question('Type "y" if you have added public key to new server, type "c" to cancel: ');


    if (answerKey.toLowerCase() === 'y') {
      const status = shell.exec(
        `ssh -i ${folderSsh}/id_rsa -q -o BatchMode=yes  -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${userServer}@${ipServer} 'exit 0'`,
      );

      if (status.code === 0) {
        shell.echo('Connect successfully via ssh');

        const installDir = readlineSync.question('Choose Installation Directory [appsmith]: ');

        let installAbsoluteDir = `/home/${userServer}/appsmith`;
        if (installDir.length !== 0 && /\/\w+/gi.test(installDir)) {
          installAbsoluteDir = installDir;
        } else if (installDir.length !== 0) {
          installAbsoluteDir = `/home/${userServer}/${installDir}`
        }
        export_db.stopApplication();
        export_db.exportDatabase();
        export_db.startApplication();

        const resDocker = shell.exec(
          `ssh -i ${folderSsh}/id_rsa ${userServer}@${ipServer} 'bash -s ${installAbsoluteDir}' < /opt/appsmith/install_docker.sh`,
        );
        if (resDocker.code === 1) {
          process.kill(process.pid);
        }

        const resPull = shell.exec(
          `ssh -i ${folderSsh}/id_rsa ${userServer}@${ipServer} 'bash -s ${installAbsoluteDir}' < /opt/appsmith/pull_resource.sh`,
        );
        if (resPull.code === 1) {
          process.kill(process.pid);
        }

        shell.exec(
          `scp -i ${folderSsh}/id_rsa -r /appsmith-stacks/configuration ${userServer}@${ipServer}:${installAbsoluteDir}/stacks`,
        );
        shell.exec(
          `scp -i ${folderSsh}/id_rsa -r /appsmith-stacks/data/backup ${userServer}@${ipServer}:${installAbsoluteDir}/stacks/data`,
        );
        shell.exec(
          `scp -i ${folderSsh}/id_rsa -r /appsmith-stacks/letsencrypt ${userServer}@${ipServer}:${installAbsoluteDir}/stacks`,
        );
        shell.exec(`ssh -i ${folderSsh}/id_rsa ${userServer}@${ipServer} 'bash -s ${installAbsoluteDir}' < /opt/appsmith/start_app.sh`);
        shell.rm('-rf', folderSsh);

        shell.echo('***************** Migrated application successfully ***************');
        shell.echo();
        shell.echo('**************************** WARNING ****************************');
        shell.echo('You should remove authorized key on new server');

        process.kill(process.pid);
      } else {
        shell.echo('Connect unsuccessfully via ssh');
        process.kill(process.pid);
      }
    } else if (answerKey.toLowerCase() === 'c') {
      process.kill(process.pid);
    }
  } else if (answerConfirm.toLowerCase() === 'c') {
    process.kill(process.pid);
  }
};

const generationKey = (path) => {
  return new Promise((resolve, reject) => {
    shell.exec(`rm -rf ${path}`);
    shell.exec(`mkdir -p ${path}`);
    shell.echo(`***** Start gen key *****`);
    shell.exec(`ssh-keygen -t rsa -b 2048 -C "" -f ${path}/id_rsa`, (err) => {
      if (err) {
        reject(false);
      }
      resolve(true);
    });
  });
};

module.exports = { runMigrate: main };
