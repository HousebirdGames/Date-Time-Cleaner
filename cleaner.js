const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const access = util.promisify(fs.access);
const readdir = util.promisify(fs.readdir);
const utimes = util.promisify(fs.utimes);
const { exec } = require('child_process');
const path = require('path');
const readlineSync = require('readline-sync');
const ignore = require('ignore');
const moment = require('moment');

let ig = ignore();

(async () => {
    try {
        await access(path.join(process.cwd(), '.gitignore'));
        const gitignore = (await readFile(path.join(process.cwd(), '.gitignore'))).toString();
        ig = ignore().add(gitignore);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
})();

async function stripDateTimeMetadata(directory, newDateTime) {
    let fileNumber = 0;
    const items = await readdir(directory, { withFileTypes: true });

    await utimes(directory, newDateTime, newDateTime);
    await exec(`powershell.exe "Get-Item '${directory}' | ForEach-Object { $_.CreationTime = '${newDateTime}' }"`);

    for (const item of items) {
        const fullPath = path.join(directory, item.name);
        const relativePath = path.relative(process.cwd(), fullPath);

        if (ig.ignores(relativePath)) {
            continue;
        }

        if (item.isDirectory()) {
            fileNumber += await stripDateTimeMetadata(fullPath, newDateTime);
        } else if (item.isFile()) {
            await utimes(fullPath, newDateTime, newDateTime);
            await exec(`powershell.exe "Get-Item '${fullPath}' | ForEach-Object { $_.CreationTime = '${newDateTime}' }"`);
        }
        fileNumber++;
    }
    return fileNumber;
}

(async () => {
    try {
        const directory = process.cwd();

        console.log(`This process will modify the metadata of your files in ${directory} (excluding everything specified in .gitignore).`);
        console.log(``);

        let newDateTime;
        const defaultDateTime = '01/01/1970 00:00:00';
        while (true) {
            newDateTime = readlineSync.question(`Enter the new date and time (MM/DD/YYYY HH:mm:ss), or press Enter to use the default (${defaultDateTime}): `, { defaultInput: defaultDateTime });
            if (moment(newDateTime, 'MM/DD/YYYY HH:mm:ss', true).isValid()) {
                break;
            } else {
                console.log('Invalid date and time. Please try again.');
            }
        }

        console.log(``);
        const userConfirmed = readlineSync.keyInYN(`Are you sure you want to continue?`);
        if (userConfirmed) {
            const spinner = createSpinner('Processing files...');
            spinner.start();
            const fileNumber = await stripDateTimeMetadata(directory, new Date(newDateTime)).catch(console.error);
            spinner.stop();
            console.log(``);
            console.log(`${fileNumber} folders/files processed`);
            console.log(``);
            console.log('Press enter/return to close');
            process.stdin.resume();
            process.stdin.once('data', () => {
                process.exit(0);
            });
        } else {
            console.log('Process cancelled by user');
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
})();

function createSpinner(message) {
    const spinnerChars = ['|', '/', '-', '\\'];
    let i = 0;

    return {
        start: function () {
            this.interval = setInterval(() => {
                process.stdout.write(`\r${message} ${spinnerChars[i]} `);
                i = (i + 1) % spinnerChars.length;
            }, 100);
        },
        stop: function () {
            clearInterval(this.interval);
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
        }
    };
}