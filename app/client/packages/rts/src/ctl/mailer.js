const nodemailer = require("nodemailer");
const Constants = require("./constants");
const utils = require("./utils");
const logger = require("./logger");

const mailEnabled = process.env.APPSMITH_MAIL_ENABLED;
const mailFrom = process.env.APPSMITH_MAIL_FROM;
const mailHost = process.env.APPSMITH_MAIL_HOST;
const mailPort = process.env.APPSMITH_MAIL_PORT;
const mailUser = process.env.APPSMITH_MAIL_USERNAME;
const mailPass = process.env.APPSMITH_MAIL_PASSWORD;
const mailTo = process.env.APPSMITH_ADMIN_EMAILS;

async function sendBackupErrorToAdmins(err, backupTimestamp) {
  console.log("Sending Error mail to admins.");
  try {
    if (
      !mailEnabled ||
      !mailFrom ||
      !mailHost ||
      !mailPort ||
      !mailUser ||
      !mailPass
    ) {
      throw new Error(
        "Failed to send error mail. Email provider is not configured, please refer to https://docs.appsmith.com/setup/instance-configuration/email to configure it.",
      );
    } else if (!mailTo) {
      throw new Error(
        "Failed to send error mail. Admin email(s) not configured, please refer to https://docs.appsmith.com/setup/instance-configuration/disable-user-signup#administrator-emails to configure it.",
      );
    } else if (!mailEnabled) {
      throw new Error(
        "Mail not sent! APPSMITH_MAIL_ENABLED env val is disabled, please refer to https://docs.appsmith.com/setup/instance-configuration/email to enable it.",
      );
    } else {
      const backupFiles = await utils.listLocalBackupFiles();
      const lastBackupfile = backupFiles.pop();
      const lastBackupTimestamp = lastBackupfile.match(
        /appsmith-backup-(.*)\.tar.gz/,
      )[1];
      const lastBackupPath = Constants.BACKUP_PATH + "/" + lastBackupfile;

      const domainName = process.env.APPSMITH_CUSTOM_DOMAIN;
      const instanceName = process.env.APPSMITH_INSTANCE_NAME;

      let text =
        "Appsmith backup did not complete successfully.\n\n " +
        "Backup timestamp: " +
        backupTimestamp +
        "\n\n" +
        "Last Successful Backup timestamp: " +
        lastBackupTimestamp +
        "\n" +
        "Last Successful Backup location: " +
        lastBackupPath +
        "\n\n";

      if (instanceName) {
        text = text + "Appsmith instance name: " + instanceName + "\n";
      }
      if (domainName) {
        text =
          text +
          "Link to Appsmith admin settings: " +
          "http://" +
          domainName +
          "/settings/general" +
          "\n";
      }
      text = text + "\n" + err.stack;

      const transporter = nodemailer.createTransport({
        host: mailHost,
        port: mailPort,
        auth: {
          user: mailUser,
          pass: mailPass,
        },
      });

      await transporter.sendMail({
        from: mailFrom,
        to: mailTo,
        subject: "[Appsmith] ERROR: Backup Failed",
        text: text,
      });
    }
  } catch (err) {
    await logger.backup_error(err.stack);
  }
}

module.exports = {
  sendBackupErrorToAdmins,
};
