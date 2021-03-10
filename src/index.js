const ora = require("ora");
const inquirer = require("inquirer");
const mcsrvutil = require("minecraft-server-util");
const chalk = require("chalk");

console.clear();
console.log(`${chalk.greenBright("RCON")} ${chalk.blueBright("Setup")}`)
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
              return 'Required'
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
              return 'Required'
          } else {
              return true;
          }
      }
    }
];
  
inquirer.prompt(questions).then((answers) => {
    console.clear();
    console.log(`${chalk.greenBright("RCON")} ${chalk.blueBright(answers.serverip)}:${chalk.cyanBright(answers.serverport)}`)
    const client = new mcsrvutil.RCON(answers.serverip, { port: parseInt(answers.serverport), enableSRV: true, timeout: 5000, password: answers.rconpass });
    const spinner = ora("Connecting to server...").start();
    client.connect()
        .then(async () => {
            spinner.succeed("Connected!");
            client.on('output', (message) => 
                console.log(`\n${message}`)
            );
            async function askForInput() {
                var questions = [
                    {
                      type: 'input',
                      name: 'cmd',
                      message: "Command"
                    }
                ];
                inquirer.prompt(questions).then(async (answers) => {
                    await client.run(answers.cmd);
                    askForInput();
                });
            }
            await askForInput();
        })
        .catch((error) => {
            if(error) {
                if(error.message) {
                    spinner.fail(error.message);
                    console.log(`\n${error}`);
                } else {
                    spinner.fail("Connection failed");
                    console.log(`\n${error}`);
                }
            } else {
                spinner.fail("Connection failed for an unknown reason");
            }
            process.exit(1);
        });
});