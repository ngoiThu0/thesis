import sys
import subprocess

def run_package_analysis(package_name, package_ecosystem):
    cmd = [ '/home/kali/thesis/thesis/package-analysis/scripts/run_analysis.sh','-nointeractive' ,'-ecosystem', package_ecosystem, '-package', package_name]
    print("Executing command:", " ".join(cmd))  # Print the command being executed for debugging purposes
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    stdout, stderr = proc.communicate()

    if proc.returncode == 0:
        print("[D] {}: success".format(package_name))
    else:
        print("[!] Error in {}:{} (returncode={})".format(package_name, package_ecosystem, proc.returncode))
        if stderr:
            print("Error output:\n", stderr.decode())  # Print stderr output for debugging

def main():
    if len(sys.argv) != 3:
        print("Usage: python run_package_analysis.py <package_name> <package_ecosystem>")
        sys.exit(1)

    package_name = sys.argv[1]
    package_ecosystem = sys.argv[2]

    run_package_analysis(package_name, package_ecosystem)

if __name__ == "__main__":
    main()
            
