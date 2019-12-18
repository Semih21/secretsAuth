//jshint esversion:6
require('dotenv').config()

const express=require('express')
const ejs=require('ejs')
const mongoose=require('mongoose')

//1
const session = require('express-session')
const passport=require('passport')
const passportLocalMongoose=require('passport-local-mongoose')
var MongoDBStore = require('connect-mongodb-session')(session);
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const findOrCreate = require('mongoose-findorcreate')



const app=express()
app.set('view engine','ejs')
app.use(express.urlencoded({extended:true}))
app.use(express.static('public'))

//2
var store = new MongoDBStore({
    uri: 'mongodb://localhost:27017/connect_mongodb_session_test',
    collection: 'mySessions'
  });

app.use(require('express-session')({
    secret: 'This is a secret',
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    store: store,
    // Boilerplate options, see:
    // * https://www.npmjs.com/package/express-session#resave
    // * https://www.npmjs.com/package/express-session#saveuninitialized
    resave: true,
    saveUninitialized: true
  }));

  //3
  app.use(passport.initialize());
  app.use(passport.session());



mongoose.connect('mongodb://localhost:27017/userDB',{useNewUrlParser:true,useUnifiedTopology: true})
mongoose.set("useCreateIndex",true)

const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
})
//4
userSchema.plugin(passportLocalMongoose); //level 5
userSchema.plugin(findOrCreate);
// console.log(process.env.API_KEY)

// userSchema.plugin(encrypt, { secret: process.env.SECRET,encryptedFields: ['password']  }); level two

const User=mongoose.model('User',userSchema)
//5
passport.use(User.createStrategy());
 
// use static serialize and deserialize of model for passport session support
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });


passport.use(new GoogleStrategy({
    clientID:process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
 userProfileURL:'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(request, accessToken, refreshToken, profile, done) {
      console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

app.get('/',(req,res)=>{

    res.render('home')
})
app.get('/auth/google',
  passport.authenticate('google', { scope:['profile']
      }
));
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/register',(req,res)=>{
    res.render('register')
})
app.get('/login',(req,res)=>{
    res.render('login')
})
app.get('/secrets',(req,res)=>{
    // if(req.isAuthenticated()){
    //     res.render('secrets')
    // }else{
    //     res.redirect('/login')
    // }

User.find({'secret':{$ne:null}},(err,foundUsers)=>{
    if(err){
        console.log(err)
    }else{
        if(foundUsers){
            res.render('secrets',{usersWithSecrets:foundUsers})
        }
    }
})

    })
    app.get('/submit',(req,res)=>{
        if(req.isAuthenticated()){
            res.render('submit')
        }else{
            res.redirect('/login')
        }
        })
app.post('/submit',(req,res)=>{
    const submittedSecret=req.body.secret
    console.log(req.user.id)
    User.findById(req.user.id,(err,foundUser)=>{
        if(err){
            console.log(err)
        }else{
            if(foundUser){
                foundUser.secret=submittedSecret
                foundUser.save(function(){
                    res.redirect('/secrets')
                })
            }
        }
    })
})
app.get('/logout',(req,res)=>{
req.logout()
res.redirect('/')
})
app.post('/register',(req,res)=>{
  
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err)
            res.redirect('/register')
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect('/secrets')
            })
        }
    })
    
 })


 app.post('/login',(req,res)=>{
const user=new User({
    username:req.body.username,
    password:req.body.password
})
req.login(user,function(err){
    if(err){
        console.log(err)
    }else{
        passport.authenticate("local")(req,res,function(){
            res.redirect('/secrets')
        })  
    }
})
    
  })
app.listen(3000,()=>{
    console.log('Server is running on port 3000')
})



//const md5=require('md5') //level 3 hashing
// const encrypt=require('mongoose-encryption') level 2
// const bcrypt = require('bcrypt'); level 4
// const saltRounds = 10;        level 4




  // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {    //level 4

    //  const newUser=new User({
    //     email:req.body.username,
    //     //password:req.body.password
    //     // password:md5(req.body.password) level 3
    //     // password:hash  level 4

    // })
    // newUser.save(function(err){
    //     if(err){
    //         console.log(err)

    //     }else{
    //         res.render('secrets')
    //     }
    // })
    //   });







  // const email=req.body.username
    // const password=req.body.password
    // // const password=md5(req.body.password) //level 3
    // User.findOne({email:email},function(err,foundUser){
    //     if(err){
    //         console.log(err)
    //     }else{
    //         if(foundUser){
    //             bcrypt.compare(password,foundUser.password,function(err,result){   //level 4
    //                 if(result===true){
    //                     res.render('secrets')
    //                 }
    //             })
    //             // if(foundUser.password===password){  level 3
                  
    //             //     res.render('secrets')   
                   
    //             // }
    //         }
    //     }
    // })