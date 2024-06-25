#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Environment variables with default values
const RESULTS_DIR = (process.env.RESULTS_DIR || "/home/kali/thesis/thesis/logs/results").trim();
const STATIC_RESULTS_DIR = (process.env.STATIC_RESULTS_DIR || "/home/kali/thesis/thesis/logs/staticResults").trim();
const FILE_WRITE_RESULTS_DIR = (process.env.FILE_WRITE_RESULTS_DIR || "/home/kali/thesis/thesis/logs/writeResults").trim();
const ANALYZED_PACKAGES_DIR = (process.env.ANALYZED_PACKAGES_DIR || "/home/kali/thesis/thesis/logs/analyzedPackages").trim();
const LOGS_DIR = (process.env.LOGS_DIR || "/home/kali/thesis/thesis/logs/dockertmp").trim();
const STRACE_LOGS_DIR = (process.env.STRACE_LOGS_DIR || "/home/kali/thesis/thesis/logs/straceLogs").trim();


// Pretty printing line
const LINE = "-----------------------------------------";

function printUsage() {
    console.log(`Usage: ${process.argv[1]} [-dryrun] [-fully-offline] <analyze args...>`);
    console.log();
    console.log(LINE);
    console.log("Script options");
    console.log("  -dryrun");
    console.log("      prints command that would be executed and exits");
    console.log("  -fully-offline");
    console.log("      completely disables network access for the container runtime");
    console.log("      Analysis will only work when using -local <pkg path> and -nopull.");
    console.log("      (see also: -offline)");
    console.log("  -nointeractive");
    console.log("      disables TTY input and prevents allocating pseudo-tty");
    console.log(LINE);
    console.log();
}

function printPackageDetails(ecosystem, pkg, version, location) {
    console.log(`Ecosystem:                ${ecosystem}`);
    console.log(`Package:                  ${pkg}`);
    console.log(`Version:                  ${version}`);
    console.log(`Location:                 ${location}`);
}

function printResultsDirs() {
    console.log(`Dynamic analysis results: ${RESULTS_DIR}`);
    console.log(`Static analysis results:  ${STATIC_RESULTS_DIR}`);
    console.log(`File write results:       ${FILE_WRITE_RESULTS_DIR}`);
    console.log(`Analyzed package saved:   ${ANALYZED_PACKAGES_DIR}`);
    console.log(`Debug logs:               ${LOGS_DIR}`);
    console.log(`Strace logs:              ${STRACE_LOGS_DIR}`);
}

const args = process.argv.slice(2);

let help = false;
let dryRun = false;
let local = false;
let dockerOffline = false;
let interactive = true;

let ecosystem = "";
let pkg = "";
let version = "";
let pkgPath = "";
let mountedPkgPath = "";

let i = 0;
while (i < args.length) {
    switch (args[i]) {
        case "-dryrun":
            dryRun = true;
            args.splice(i, 1);
            break;
        case "-fully-offline":
            dockerOffline = true;
            args.splice(i, 1);
            break;
        case "-nointeractive":
            interactive = false;
            args.splice(i, 1);
            break;
        case "-help":
            help = true;
            i++;
            break;
        case "-local":
            local = true;
            i++;
            pkgPath = path.resolve(args[i]);
            if (!pkgPath) {
                console.error("-local specified but no package path given");
                process.exit(255);
            }
            const pkgFile = path.basename(pkgPath);
            mountedPkgPath = `/${pkgFile}`;
            args[i] = mountedPkgPath;
            break;
        case "-ecosystem":
            i++;
            ecosystem = args[i];
            break;
        case "-package":
            i++;
            pkg = args[i];
            break;
        case "-version":
            i++;
            version = args[i];
            break;
        default:
            i++;
            break;
    }
}

if (args.length === 0) {
    help = true;
}

const DOCKER_OPTS = ["run", "--cgroupns=host", "--privileged", "--rm"];
const CONTAINER_MOUNT_DIR = process.env.CONTAINER_DIR_OVERRIDE || "/var/lib/containers";
const DOCKER_MOUNTS = [
    `-v ${CONTAINER_MOUNT_DIR}:/var/lib/containers`,
    `-v ${RESULTS_DIR}:/results`,
    `-v ${STATIC_RESULTS_DIR}:/staticResults`,
    `-v ${FILE_WRITE_RESULTS_DIR}:/writeResults`,
    `-v ${LOGS_DIR}:/tmp`,
    `-v ${ANALYZED_PACKAGES_DIR}:/analyzedPackages`,
    `-v ${STRACE_LOGS_DIR}:/straceLogs`
];

const ANALYSIS_IMAGE = "gcr.io/ossf-malware-analysis/analysis";
let analysisArgs = [
    "analyze",
    "-dynamic-bucket", "file:///results/",
    "-file-writes-bucket", "file:///writeResults/",
    "-static-bucket", "file:///staticResults/",
    "-analyzed-pkg-bucket", "file:///analyzedPackages/",
    "-execution-log-bucket", "file:///results"
];

analysisArgs = analysisArgs.concat(args);

if (help) {
    printUsage();
    process.exit(0);
}

if (interactive) {
    DOCKER_OPTS.push("-ti");
}

let location = local ? pkgPath : "remote";
if (local) {
    DOCKER_MOUNTS.push(`-v ${pkgPath}:${mountedPkgPath}`);
}

if (dockerOffline) {
    DOCKER_OPTS.push("--network", "none");
}

const packageDefined = ecosystem && pkg;

if (packageDefined) {
    console.log(LINE);
    console.log("Package Details");
    printPackageDetails(ecosystem, pkg, version, location);
    console.log(LINE);
}

if (dryRun) {
    console.log("Analysis command (dry run)");
    console.log();
    console.log(`docker ${DOCKER_OPTS.join(' ')} ${DOCKER_MOUNTS.join(' ')} ${ANALYSIS_IMAGE} ${analysisArgs.join(' ')}`);
    console.log();
    process.exit(0);
}

if (packageDefined) {
    console.log("Analyzing package");
    console.log();
}

if (local && (!fs.existsSync(pkgPath) || !fs.accessSync(pkgPath, fs.constants.R_OK))) {
    console.error(`Error: path ${pkgPath} does not refer to a file or is not readable`);
    console.log();
    process.exit(1);
}

setTimeout(() => {
    console.log("Execution will start...");
}, 1000);

[RESULTS_DIR, STATIC_RESULTS_DIR, FILE_WRITE_RESULTS_DIR, ANALYZED_PACKAGES_DIR, LOGS_DIR, STRACE_LOGS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const result = spawnSync('docker', [...DOCKER_OPTS, ...DOCKER_MOUNTS, ANALYSIS_IMAGE, ...analysisArgs], { stdio: 'inherit' });

const dockerExitCode = result.status;

if (packageDefined) {
    console.log();
    console.log(LINE);
    if (dockerExitCode === 0) {
        console.log("Finished analysis");
        console.log();
        printPackageDetails(ecosystem, pkg, version, location);
        printResultsDirs();
    } else {
        console.log("Analysis failed");
        console.log();
        console.log(`docker process exited with code ${dockerExitCode}`);
        console.log();
        printPackageDetails(ecosystem, pkg, version, location);
        [RESULTS_DIR, STATIC_RESULTS_DIR, FILE_WRITE_RESULTS_DIR, ANALYZED_PACKAGES_DIR, LOGS_DIR, STRACE_LOGS_DIR].forEach(dir => {
            fs.rmdirSync(dir, { recursive: true });
        });
    }
    console.log(LINE);
}

process.exit(dockerExitCode);
