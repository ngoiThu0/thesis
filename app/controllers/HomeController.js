class HomeController{
    index(req, res){
        if(req.query.xuanquang === 'xq'){
            re.render('xq')
        }
        else{
            // console.log('dcu dday la homeies')
            res.render('home')
        }
    }
}

module.exports = new HomeController