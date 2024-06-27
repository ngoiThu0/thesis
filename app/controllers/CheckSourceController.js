const path = require('path')
path.join(__dirname, '../package-analysis/scripts/run_analysis.sh')
const { run_package_analysis } = require(path.join(__dirname, '../../scripts/run_package_analysis.js'));  // Adjust the path accordingly

class CheckSourceController {
    get(req, res) {
        res.render('checkSource');
    }

    post(req, res) {
        const packageName = req.body?.name;
        const ecosystem = req.body?.ecosystem;
        const version = req.body?.version;
        run_package_analysis(packageName, ecosystem, version, res);
    }
}

module.exports = new CheckSourceController();
