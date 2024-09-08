var express = require('express');
var router = express.Router();
const openModel= require("./open");
const postModel= require("./post");
const passport = require('passport');
const upload = require("./multer");

const localStrategy = require("passport-local");
passport.use(new localStrategy(openModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/feed', function(req, res, next) {
  res.render('feed', { title: 'Express' });
});
router.post('/upload',isloggedIn, upload.single('file'), async function(req, res, next) {
  console.log('File received:', req.file); // Debug log

  if (!req.file) {
    return res.status(404).send("No file was given");
  }
  
  const user= await openModel.findOne({
    _id: req.session.passport.user});
  const post=await postModel.create({
    image:req.file.filename,
    postText:req.body.filecaption,
    user:user._id
  });
   user.posts.push(post._id);
   await user.save();
  res.redirect('/profile');
 
});
router.get('/login', function(req, res, next) {
  res.render('login',{error:req.flash('error')});
});
router.get('/profile', isloggedIn, async function(req, res, next) {
 
    // Fetch the user from the database using the user ID
    const user = await openModel.findOne({
      _id: req.session.passport.user
    })
    .populate("posts")

    console.log('User found:', user);

   

    res.render('profile', { user }); // Pass 'user' to the template
  
});




router.post("/register", function(req,res){
  const userData = new openModel({
    username: req.body.username,
    email: req.body.email,
    fullname: req.body.fullname,

  });
  openModel.register(userData, req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res, function(){
      res.redirect("/profile");
    })
  })
})

router.post("/login",passport.authenticate("local",{
  successRedirect: "/profile",
  failureRedirect: "/",
  failureFlash: true,
}), function(res,req){

});
router.get("/logout", function (req, res) {
  req.logout(function(err) {
    if (err) {
      return next(err); // Pass any errors to the next middleware
    }
    res.redirect('/login'); // Redirect to the homepage after successful logout
  });
});


function isloggedIn(req,res,next){
  if(req.isAuthenticated()) return next();
  res.redirect("/login");
}

module.exports = router;
