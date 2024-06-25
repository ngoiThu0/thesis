#!/usr/bin/env python3
import os
import subprocess
import sys
import tempfile

# Default directory paths
RESULTS_DIR = os.getenv('RESULTS_DIR', '/tmp/results')
STATIC_RESULTS_DIR = os.getenv('STATIC_RESULTS_DIR', '/tmp/staticResults')
FILE_WRITE_RESULTS_DIR = os.getenv('FILE_WRITE_RESULTS_DIR', '/tmp/writeResults')
ANALYZED_PACKAGES_DIR = os.getenv('ANALYZED_PACKAGES_DIR', '/tmp/analyzedPackages')
LOGS_DIR = os.getenv('LOGS_DIR', '/tmp/dockertmp')
STRACE_LOGS_DIR = os.getenv('STRACE_LOGS_DIR', '/tmp/straceLogs')

# Pretty printing line
LINE = "-----------------------------------------"

def print_usage():
    print(f"Usage: {sys.argv[0]} [-dryrun] [-fully-offline] <analyze args...>\n")
    print(LINE)
    print("Script options")
    print("  -dryrun")
    print("      prints command that would be executed and exits")
    print("  -fully-offline")
    print("      completely disables network access for the container runtime")
    print("      Analysis will only work when using -local <pkg path> and -nopull.")
    print("      (see also: -offline)")
    print("  -nointeractive")
    print("      disables TTY input and prevents allocating pseudo-tty")
    print(LINE)
    print()

def print_package_details():
    print(f"Ecosystem:                {ECOSYSTEM}")
    print(f"Package:                  {PACKAGE}")
    print(f"Version:                  {VERSION}")
    if LOCAL:
        location = PKG_PATH
    else:
        location = "remote"
    print(f"Location:                 {location}")

def print_results_dirs():
    print(f"Dynamic analysis results: {RESULTS_DIR}")
    print(f"Static analysis results:  {STATIC_RESULTS_DIR}")
    print(f"File write results:       {FILE_WRITE_RESULTS_DIR}")
    print(f"Analyzed package saved:   {ANALYZED_PACKAGES_DIR}")
    print(f"Debug logs:               {LOGS_DIR}")
    print(f"Strace logs:              {STRACE_LOGS_DIR}")

args = sys.argv[1:]
HELP = '-help' in args
DRYRUN = '-dryrun' in args
LOCAL = '-local' in args
DOCKER_OFFLINE = '-fully-offline' in args
INTERACTIVE = '-nointeractive' not in args

ECOSYSTEM = ''
PACKAGE = ''
VERSION = ''
PKG_PATH = ''
MOUNTED_PKG_PATH = ''

i = 0
while i < len(args):
    if args[i] == '-ecosystem':
        ECOSYSTEM = args[i+1]
    elif args[i] == '-package':
        PACKAGE = args[i+1]
    elif args[i] == '-version':
        VERSION = args[i+1]
    elif args[i] == '-local':
        LOCAL = True
        PKG_PATH = os.path.realpath(args[i+1])
        i += 1
    i += 1

if not any([ECOSYSTEM, PACKAGE]):
    HELP = True

DOCKER_OPTS = ['run', '--cgroupns=host', '--privileged', '--rm']
DOCKER_MOUNTS = [
    f'-v {RESULTS_DIR}:/results',
    f'-v {STATIC_RESULTS_DIR}:/staticResults',
    f'-v {FILE_WRITE_RESULTS_DIR}:/writeResults',
    f'-v {LOGS_DIR}:/tmp',
    f'-v {ANALYZED_PACKAGES_DIR}:/analyzedPackages',
    f'-v {STRACE_LOGS_DIR}:/straceLogs'
]

ANALYSIS_IMAGE = 'gcr.io/ossf-malware-analysis/analysis'
ANALYSIS_ARGS = [
    'analyze',
    '-dynamic-bucket', 'file:///results/',
    '-file-writes-bucket', 'file:///writeResults/',
    '-static-bucket', 'file:///staticResults/',
    '-analyzed-pkg-bucket', 'file:///analyzedPackages/',
    '-execution-log-bucket', 'file:///results'
]
ANALYSIS_ARGS.extend(args)

if HELP:
    print_usage()
    sys.exit(0)

if DRYRUN:
    print("Analysis command (dry run)")
    print(f"docker {' '.join(DOCKER_OPTS)} {' '.join(DOCKER_MOUNTS)} {ANALYSIS_IMAGE} {' '.join(ANALYSIS_ARGS)}")
    sys.exit(0)

if LOCAL:
    MOUNTED_PKG_PATH = f'/{os.path.basename(PKG_PATH)}'
    DOCKER_MOUNTS.append(f'-v {PKG_PATH}:{MOUNTED_PKG_PATH}')

if not os.path.exists(RESULTS_DIR):
    os.makedirs(RESULTS_DIR)
if not os.path.exists(STATIC_RESULTS_DIR):
    os.makedirs(STATIC_RESULTS_DIR)
if not os.path.exists(FILE_WRITE_RESULTS_DIR):
    os.makedirs(FILE_WRITE_RESULTS_DIR)
if not os.path.exists(ANALYZED_PACKAGES_DIR):
    os.makedirs(ANALYZED_PACKAGES_DIR)
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)
if not os.path.exists(STRACE_LOGS_DIR):
    os.makedirs(STRACE_LOGS_DIR)

if INTERACTIVE:
    DOCKER_OPTS.append('-ti')

if DOCKER_OFFLINE:
    DOCKER_OPTS.extend(['--network', 'none'])

if ECOSYSTEM and PACKAGE:
    print(LINE)
    print("Package Details")
    print_package_details()
    print(LINE)
    print("Analyzing package")

docker_command = ['docker'] + DOCKER_OPTS + DOCKER_MOUNTS + [ANALYSIS_IMAGE] + ANALYSIS_ARGS

print()
print(' '.join(docker_command))
print()

try:
    subprocess.run(docker_command, check=True)
except subprocess.CalledProcessError as e:
    print()
    print(LINE)
    print("Analysis failed")
    print()
    print(f"docker process exited with code {e.returncode}")
    print()
    print_package_details()
    print_results_dirs()
    print(LINE)
    sys.exit(e.returncode)
else:
    print()
    print(LINE)
    print("Finished analysis")
    print()
    print_package_details()
    print_results_dirs()
    print(LINE)
    sys.exit(0)
