class NotFoundController{
    index(req, res){
        if(req.query.xuanquang === 'xq'){
            re.render('xq')
        }
        else{
            res.render('404')
        }
    }
}

module.exports = new NotFoundController