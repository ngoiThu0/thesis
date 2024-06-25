const fs = require('fs')
const homeRouter = require('./home.js')
const aboutRouter = require('./about.js')
const checkSourceRouter = require('./checkSource.js')
const notFoundRouter = require('./404.js')

function routes (app){
    // app.use('/', )

    // fs.readdir('.', (err, files) => {
    //     if (err) {
    //         console.error('Error reading directory:', err);
    //         return;
    //     }
    //     console.log('Files in directory:');
    //     files.forEach(file => {
    //         console.log(file);
    //     });
    // })

    app.use((req, res, next) => {
        if (req.path === '/') {
            res.redirect('/home');
        } else {
            next();
        }
    });
    
    app.use('/home', homeRouter)

    app.use('/about', aboutRouter)

    app.use('/checksource', checkSourceRouter)


    app.use('*', notFoundRouter)


}

module.exports = routes