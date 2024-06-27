const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');


function run_model(package_name, package_ecosystem, package_version, res){
    const pythonScriptPath = path.join(__dirname, './read_json.py');

    const pythonProcess = spawn('python', [pythonScriptPath, package_name, package_ecosystem, package_version]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        data = data.toString();
        
        let percentageRegex = /\b\d+(.\d+)?%/g;
        let match = data.match(percentageRegex);
        let percentage = match ? match[0] : '';

        let lines = data.trim().split('\n');
        let dataLine = lines.find(line => line.includes('express_'));
        let numbers;
        if (dataLine) {
            numbers = dataLine.trim().split(/\s+/).filter(item => !isNaN(parseInt(item))).map(item => parseInt(item));
            console.log("Numbers:", numbers);
        }

        res.json({name: package_name, ecosystem: package_ecosystem, version: package_version, percentage: percentage, commands: numbers[1], domains: numbers[2], ips: numbers[3]});
    });
    
    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    pythonProcess.unref();

}



function run_package_analysis(package_name, package_ecosystem, package_version, res) {

    let checkExist;
    const jsonPath = `/tmp/results/${package_ecosystem}/${package_name}/${package_version}.json`;
    fs.access(jsonPath, fs.constants.F_OK, (err) => {
        if (err) {
            console.log('File does not exist.');
            checkExist = false;
        } else {
            console.log('File exists.');
            checkExist = true;
        }
    });

    if (checkExist){
        run_model(package_name, package_ecosystem, package_version, res);
        return;
    }

    const cmd = [
        path.join(__dirname, '../package-analysis/scripts/run_analysis.sh'),
        '-nointeractive',
        '-ecosystem',
        package_ecosystem,
        '-package',
        package_name,
        '-version',
        package_version
    ];

    // const cmd = [
    //     'python',
    //     '/home/kali/thesis/thesis/scripts/run_package_analysis.py',
    //     package_name,
    //     package_ecosystem
    // ];

    console.log("Executing command:", cmd.join(' '));  // Print the command being executed for debugging purposes

    const proc = spawn(cmd[0], cmd.slice(1), { detached: true, env: process.env });  // Use spawn with detached option and environment variables

    proc.stdout.on('data', (data) => {
        console.log('STDOUT:', data.toString());  // Log stdout data
    });

    proc.stderr.on('data', (data) => {
        console.error('STDERR:', data.toString());  // Log stderr data with more context
    });

    // Handle process close event
    proc.on('close', (code) => {

        if (code === 0) {
            console.log(`[D] ${package_name}: success`);
            // TODO read logs analysis package, preprocess to ML model
            run_model(package_name, package_ecosystem, package_version, res)
            
            // res.send(`Package Name: ${package_name}, Ecosystem: ${package_ecosystem}`);
        } else {
            console.error(`[!] Error in ${package_name}:${package_ecosystem} (returncode=${code})`);
            res.status(500).json({error: `Internal Server Error (return code: ${code})`});
        }
    });


    // Handle unexpected errors
    proc.on('error', (err) => {
        console.error('Failed to spawn subprocess:', err);
        res.status(500).send(`Internal Server Error: ${err.message}`);
    });

    // Detach the child process to allow the parent Node.js process to exit independently
    proc.unref();
}

module.exports = {
    run_package_analysis
};
