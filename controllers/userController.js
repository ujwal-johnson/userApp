const User= require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const randomString = require("randomstring")
const config = require("../config/config")

const securePassword = async(password)=>{
    try{

      const passwordHash = await  bcrypt.hash(password,10);
      return passwordHash;

    }catch(error){
    console.log(error.message);
    }
}

//for send mail
const sendverifyMail = async(name,email,user_id)=>{

    try{
        const transporter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:config.emailUser,
                pass:config.emailPassword
            }
        });
        const mailOptions = {
            from:config.emailUser,
            to:email,
            subject:'For verification mail',
            html:'<p> Hi '+name+', Please click here to <a href="http://127.0.0.1:3000/verify?id='+user_id+'"> verify </a> your mail.</p>'
        }
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error);
            }else{
                console.log("Email has been sent:-",info.response);
            }
        })

    }catch(error){
        console.log(error.message);
    }
}

// for reset password send mail 
const sendResetPasswordMail = async(name,email,token)=>{

    try{
        const transporter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:config.emailUser,
                pass:config.emailPassword
            }
        });
        const mailOptions = {
            from:config.emailUser,
            to:email,
            subject:'For Reset password',
            html:'<p> Hi '+name+', Please click here to <a href="http://127.0.0.1:3000/forget-password?token='+token+'"> Reset </a> your password.</p>'
        }
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error);
            }else{
                console.log("Email has been sent:-",info.response);
            }
        })

    }catch(error){
        console.log(error.message);
    }
}

const loadRegister = async(req,res)=>{
    try{
        res.render('registration');

    }catch(error){
        console.log(error.message);
    }
}

const insertUser = async(req,res)=>{
    try{
        const spassword=await securePassword(req.body.password);
     const newUser = new User({
        name:req.body.name,
        email:req.body.email,
        mobile:req.body.mno,
        image:req.file.filename,
        password:spassword,
        is_admin:0
     })

     const userData =await newUser.save();

     if(userData){
        sendverifyMail(req.body.name,req.body.email,userData._id);
        res.render('registration',{message:"Your Registration has been sucessfully,Please verify your mail."})
     }else{
        res.render('registration',{message:"Your Registration has Failed."})

     }

    }catch(error){
        console.log(error.message);
    }
}
const verifyMail = async(req,res)=>{
    try {
       const updatInfo = await User.updateOne({_id:req.query.id},{ $set:{is_varified:1} });
        console.log(updatInfo);
        res.render("email-verified")
   
    } catch (error) {
        console.log(error.message);
        
    }
} 
//login user methods started
const loginload= async(req,res)=>{
    try {
        res.render('login');
    } catch (error) {
     console.log(error.message);   
    }
}

const verifylogin=async(req,res)=>{

    try {
        const email= req.body.email;
        const password= req.body.password;
        

       const userData = await  User.findOne({email:email})

       if (userData) {
          const passwordMatch= bcrypt.compare(password,userData.password);
          if (passwordMatch) {
           if (userData.is_varified === 0) {
                res.render('login',{message:"Please verify your mail."})            
           } else {
            req.session.user_id = userData._id;
            res.redirect('/home');
           }
            

          } else {
            res.render('login',{message:"Email and Password is incorrect"})

          }

       } else {
        res.render('login',{message:"Email and Password is incorrect"})
       }

    } catch (error) {
        console.log(error.message);
        
    }
}

const loadHome= async(req,res)=>{
    try {

        const userData = await User.findById({_id:req.session.user_id})
        res.render('home',{user:userData});
    } catch (error) {
        console.log(error.message);
    }
}

const userLogout = async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/');

    } catch (error) {
        console.log(error.message);
    }
}
//forget password start
const forgetLoad = async(req,res)=>{
    try {
      res.render('forget')  
    } catch (error) {
        console.log(error.message);
        
    }
}
const forgetVerify = async(req,res)=>{
    try {
      const email= req.body.email;
      const userData = await user_route.findOne({email:email})
      if(userData){
        if (userData.is_varified == 0) {
            res.render('forget',{message:"Please verify your mail"})
         } else {
            const randomString = randomString.generate()
           const updatedData = await User.updateOne({email:email},{$set:{token:randomString}});
            sendResetPasswordMail(userData.name,userData.email,randomString);
            res.render('forget',{message:"Please check your mail to reset your password"})

        }

      }else{
        res.render('forget',{message:"User mail incorrect"})
      }
      
    } catch (error) {
        console.log(error.message);
    }
} 

//user profile edit and update
// const editLoad = async(req,res)=>{
//     try {
        
//         const id = req.query.id;

//       const userData = await User.findById({_id:id })

//       if (userData) {
//         res.render('edit',{user:userData})
//       } else {
//         res.redirect('/home')
//       }


//     } catch (error) {
//         console.log(error.message);
//     }
// }
const editLoad = async(req,res)=>{

    try{
        const id = req.query.id;
        const userData = await User.findById({_id:id}) 
        if(userData){
            res.render('edit',{user:userData})
        }   else{
            res.redirect('/home')
        }    
    }catch(error){
        console.log(error.message)
    }

}

const updateProfile = async(req,res)=>{
    try {
        
        if(req.file){
            const userData = await User.findByIdAndUpdate({_id:req.body.user_id},{$set:{name:req.body.name, email:req.body.email, mobile:req.body.mno, image:req.file.filename} }) 

        }else{
         const userData = await User.findByIdAndUpdate({_id:req.body.user_id},{$set:{name:req.body.name, email:req.body.email, mobile:req.body.mno} }) 
        }

res.redirect('/home')


    } catch (error) {
        console.log(error.message);
}
}


module.exports = {
    loadRegister,
    insertUser,
    verifyMail,
    loginload,
    verifylogin,
    loadHome,
    userLogout,
    forgetLoad,
    forgetVerify,
    editLoad,
    updateProfile

}
 