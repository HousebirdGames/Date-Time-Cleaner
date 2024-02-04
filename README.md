# Date-Time Cleaner

Date-Time Cleaner is a Node.js application for Windows that sets the creation and last modified dates/times of the folder it is in, all subfolders, and all contained items to the default value of "01/01/1970 00:00:00". It excludes everything specified in the `.gitignore` file.

## Pre-compiled Executable

A pre-compiled executable for Windows x64 is available in the `/dist` directory. You can download and run this executable without needing to install Node.js or any dependencies.

## Initialization

Before running the application, you need to install the necessary dependencies. Run the following command in your terminal:

```bash
npm install
```

## Running the Application

To run the application, use the following command:

```bash
npm start
```

This command will start the application in your terminal. The application will ask for your confirmation before it starts modifying the metadata of your files.

## Packaging the Application

To package the application into an executable file, use the `pkg` tool with the following command:

```bash
pkg . --targets node14-win-x64 -o ./dist/Date-Time-Cleaner
```

This command will package the application and output the executable file to the `./dist` directory. The packaged application can be run on any Windows machine with x64 architecture, without needing to install Node.js or any dependencies.

## Note

Please use this tool responsibly. Modifying the metadata of your files can have unintended consequences. Always make sure to back up your files before running this application.