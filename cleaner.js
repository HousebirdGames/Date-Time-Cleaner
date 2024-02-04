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

async function stripDateTimeMetadata(directory) {
    let fileNumber = 0;
    const items = await readdir(directory, { withFileTypes: true });

    const epoch = new Date(0);
    await utimes(directory, epoch, epoch);
    await exec(`powershell.exe "Get-Item '${directory}' | ForEach-Object { $_.CreationTime = '01/01/1970 00:00:00' }"`);

    for (const item of items) {
        const fullPath = path.join(directory, item.name);
        const relativePath = path.relative(process.cwd(), fullPath);

        if (ig.ignores(relativePath)) {
            //console.log(`Ignoring ${relativePath}`);
            continue;
        }
        else {
            //console.log(`Processing ${relativePath}`);
        }

        if (item.isDirectory()) {
            fileNumber += await stripDateTimeMetadata(fullPath);
        } else if (item.isFile()) {
            await utimes(fullPath, epoch, epoch);
            await exec(`powershell.exe "Get-Item '${fullPath}' | ForEach-Object { $_.CreationTime = '01/01/1970 00:00:00' }"`);
        }
        fileNumber++;
    }
    return fileNumber;
}

(async () => {
    try {
        const directory = process.cwd();
        const userConfirmed = readlineSync.keyInYN(`This process will modify the metadata of your files in ${directory} (excluding everything specified in .gitignore). Are you sure you want to continue?`);
        if (userConfirmed) {
            const spinner = createSpinner('Processing files...');
            spinner.start();
            const fileNumber = await stripDateTimeMetadata(directory).catch(console.error);
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