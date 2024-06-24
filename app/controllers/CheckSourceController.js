class CheckSourceController{
    get(req, res){
        // console.log('body:', req.body?.link);

        res.render('checkSource')
    }

    post(req, res){
        res.json({message: 'đã nhận được rồi', name: req.body?.name})
    }
}

module.exports = new CheckSourceController