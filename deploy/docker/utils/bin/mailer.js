const nodemailer = require('nodemailer');
const shell = require('shelljs');


const Constants = require('./constants');
const utils = require('./utils');
const logger = require('./logger');

const mailEnabled = process.env.APPSMITH_MAIL_ENABLED
const mailFrom = process.env.APPSMITH_MAIL_FROM
const mailHost = process.env.APPSMITH_MAIL_HOST
const mailPort = process.env.APPSMITH_MAIL_PORT
const mailUser = process.env.APPSMITH_MAIL_USERNAME
const mailPass = process.env.APPSMITH_MAIL_PASSWORD
const mailTo = process.env.APPSMITH_ADMIN_EMAILS

async function sendBackupErrorToAdmins(err, backupTimestamp){
    console.log('Sending Error mail to admins.');
    try{
        if ( !mailEnabled || !mailFrom || !mailHost || !mailPort || !mailUser || !mailPass ){
            throw new Error('Failed to send error mail. Email provider is not configured, please refer to https://docs.appsmith.com/setup/instance-configuration/email to configure it.');
          }
        else if (!mailTo){
            throw new Error('Failed to send error mail. Admin email(s) not configured, please refer to https://docs.appsmith.com/setup/instance-configuration/disable-user-signup#administrator-emails to configure it.');
          }
        else if (!mailEnabled){
            throw new Error('Mail not sent! APPSMITH_MAIL_ENABLED env val is disabled, please refer to https://docs.appsmith.com/setup/instance-configuration/email to enable it.');
        }
        else {
            const backupFiles = await utils.listLocalBackupFiles();
            const lastBackupfile = backupFiles.pop();
            const lastBackupTimestamp = lastBackupfile.match(/appsmith-backup-(.*)\.tar.gz/)[1]
            const lastBackupPath = Constants.BACKUP_PATH + '/' + lastBackupfile;
        
            let domainNameOrIP = process.env.APPSMITH_CUSTOM_DOMAIN 
            if (domainNameOrIP === ''){
                console.log('Host IP:')
                domainNameOrIP = shell.exec('curl -s ifconfig.me')
                console.log('\n')
            }
            
          const adminSettingsURL = 'http://' + domainNameOrIP + '/settings/general'
          const transporter = nodemailer.createTransport({
            host: mailHost,
            port: mailPort,
            auth: {
                user: mailUser,
                pass: mailPass
              }
          });
          const text = 'Appsmith backup did not complete successfully.\n\n ' + 
                        'Backup timestamp: ' + backupTimestamp + '\n\n' +
                        'Last Successful Backup timestamp: ' + lastBackupTimestamp + '\n' +
                        'Last Successful Backup location: ' + lastBackupPath + '\n\n' +
                        'Link to Appsmith admin settings: ' + adminSettingsURL +
                        '\n\n' + err.stack;
        //   console.log('Mail body: ' + text)
            await transporter.sendMail({
                from: mailFrom,
                to: mailTo,
                subject: '[Appsmith] ERROR: Backup Failed',
                text: text
                });
            }
        } catch(err){
            console.log(err);
            await logger.backup_error(err.stack);
            return
    }
}

module.exports = {
    sendBackupErrorToAdmins,
};