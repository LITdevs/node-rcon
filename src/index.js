const ora = require("ora");
const inquirer = require("inquirer");
const mcsrvutil = require("minecraft-server-util");
const chalk = require("chalk");
const emoji = require("node-emoji");
require('dotenv').config()

console.clear();
if(!process.env.RCON_PORT || !process.env.RCON_IP || !process.env.RCON_PASSWORD) {
    console.log(`${chalk.greenBright("RCON")} ${chalk.blueBright("Setup")}`)
    console.log(`${emoji.get("file_folder")} ${chalk.yellowBright.bold("Consider making a .env file so you don't need to fill this in again.")}`)
    var questions = [
        {
            type: 'input',
            name: 'serverport',
            message: "Port",
            default: 25575,
            validate: function(value) {
                if(isNaN(parseInt(value))) {
                    return 'Must be a number'
                } else {
                    return true;
                }
            }
        },
        {
          type: 'input',
          name: 'serverip',
          message: "IP",
          validate: function(value) {
              if(value.length == 0) {
                  return 'The server IP is required.'
              } else {
                  return true;
              }
          }
        },
        {
          type: 'password',
          name: 'rconpass',
          message: "RCON password",
          validate: function(value) {
              if(value.length == 0) {
                  return 'The RCON password is required.'
              } else {
                  return true;
              }
          }
        }
    ];
      
    inquirer.prompt(questions).then((answers) => {serverConnect(answers, false)});
} else {
    serverConnect({serverip: process.env.RCON_IP, serverport: parseInt(process.env.RCON_PORT), rconpass: process.env.RCON_PASSWORD}, true)
}

async function serverConnect(answers, envLoaded) {
    console.clear();
    console.log(`${chalk.greenBright("RCON")} ${chalk.blueBright(answers.serverip)}:${chalk.cyanBright(answers.serverport)}`)
    if(envLoaded) {
        console.log(`${emoji.get("open_file_folder")} ${chalk.yellowBright.bold("Credentials gotten from .env file.")}`)
    } else {
        console.log(`${emoji.get("information_source")} ${chalk.yellowBright.bold("Credentials entered by user.")}`)
    }
    console.log()
    const client = new mcsrvutil.RCON(answers.serverip, { port: parseInt(answers.serverport), enableSRV: true, timeout: 5000, password: answers.rconpass });
    const spinner = ora("").start();
    spinner.prefixText = `Connecting to ${chalk.blueBright(answers.serverip)}:${chalk.cyanBright(answers.serverport)}...`
    spinner.spinner = "clock"
    client.connect()
        .then(async () => {
            spinner.prefixText = "Connected!"
            spinner.succeed()
            client.on('output', (message) => {
                if(!message == "") console.log(`${message.replace(/§([0-9]|[a-f]|[k-o]|r)/g, "")}`);
                askForInput();
            });
            async function askForInput() {
                var questions = [
                    {
                      type: 'input',
                      name: 'cmd',
                      message: "Command"
                    }
                ];
                inquirer.prompt(questions).then(async (answers) => {
                        let sending = ora("").start();
                        sending.prefixText = `Sending...`
                        sending.spinner = "clock"
                        sending.render();
                        client.run(answers.cmd).then(sending.stop())
                });
            }
            await askForInput();
        })
        .catch((error) => {
            if(error) {
                if(error.message) {
                    spinner.prefixText = error.message
                    spinner.fail();
                    console.log(`\n${error}`);
                } else {
                    spinner.prefixText = "Connection failed"
                    spinner.fail();
                    console.log(`\n${error}`);
                }
            } else {
                spinner.prefixText = "Connection failed for an unknown reason"
                spinner.fail();
            }
            process.exit(1);
        });
}