const { exec, spawn } = require('child_process');
const path = require('path')



function run_package_analysis(package_name, package_ecosystem, res) {
    const cmd = [
        path.join(__dirname, '../package-analysis/scripts/run_analysis.sh'),
        '-nointeractive',
        '-ecosystem',
        package_ecosystem,
        '-package',
        package_name
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

            const pythonScriptPath = path.join(__dirname, './read_json.py');

            const pythonProcess = spawn('python', [pythonScriptPath, package_name, package_ecosystem]);

            pythonProcess.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
                res.json({data: data});
            });
            
            pythonProcess.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });

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
