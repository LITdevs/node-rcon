const ora = require("ora");
const inquirer = require("inquirer");
const mcsrvutil = require("minecraft-server-util");

console.clear();
var questions = [
    {
      type: 'input',
      name: 'serverip',
      message: "IP"
    },
    {
      type: 'password',
      name: 'rconpass',
      message: "RCON password"
    }
];
  
inquirer.prompt(questions).then((answers) => {
    console.clear();
    const client = new mcsrvutil.RCON(answers.serverip, { port: 25575, enableSRV: true, timeout: 5000, password: answers.rconpass });
    const spinner = ora("Connecting...").start();
    client.connect()
        .then(async () => {
            spinner.succeed("Connected!");
            client.on('output', (message) => console.log(`${message}`));
            async function askForInput() {
                var questions = [
                    {
                      type: 'input',
                      name: 'cmd',
                      message: "exec"
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
            spinner.fail(error.message);
            process.exit(1);
        });
});