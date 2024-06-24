const express = require('express')
const handlebars = require('express-handlebars')
const path = require('path')
const bodyParser = require('body-parser');
const routes = require('./routes/main')

require('dotenv').config()

const app = express()

//setting public, views and partials folders
app.use(express.static(path.join(__dirname, '../public')))

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//template engine
app.engine('hbs', handlebars.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, './views/layouts'),
    partialsDir: path.join(__dirname, './views/partials')
}))

//setting for template engine
app.set('view engine', 'hbs')
app.set('views', './resources/views')

//routing
routes(app)


//listen web/app
app.listen(process.env.PORT || 3000)