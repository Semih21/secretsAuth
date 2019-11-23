//jshint esversion:6

const express=require('express')
const ejs=require('ejs')
const mongoose=require('mongoose')

const app=express()
app.set('view engine','ejs')
app.use(express.urlencoded({extended:true}))
app.use(express.static('public'))
mongoose.connect('mongodb://localhost:27017/userDB',{useNewUrlParser:true})
const userSchema=new mongoose.Schema({
    email:String,
    password:String
})
const User=mongoose.model('User',userSchema)

app.get('/',(req,res)=>{

    res.render('home')
})

app.get('/register',(req,res)=>{
    res.render('register')
})
app.get('/login',(req,res)=>{
    res.render('login')
})

app.post('/register',(req,res)=>{
    const newUser=new User({
        email:req.body.username,
        password:req.body.password
    })
    newUser.save(function(err){
        if(err){
            console.log(err)

        }else{
            res.render('secrets')
        }
    })
})

app.post('/login',(req,res)=>{

    const email=req.body.username
    const password=req.body.password
    User.findOne({email:email},function(err,foundUser){
        if(err){
            console.log(err)
        }else{
            if(foundUser){
                if(foundUser.password===password){
                    res.render('secrets')
                   
                }
            }
        }
    })
})
app.listen(3000,()=>{
    console.log('Server is running on port 3000')
})