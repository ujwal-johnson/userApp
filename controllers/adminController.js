const User = require("../models/userModel")
const bcrypt = require('bcrypt')
const randomstring =require('randomstring')

const securePassword = async(password)=>{
    try{

      const passwordHash = await  bcrypt.hash(password,10);
      return passwordHash;

    }catch(error){
    console.log(error.message);
    }
}
//for send mail
const addUserMail = async(name,email,password,user_id)=>{

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
            subject:'Admin add you and Verify your Mail',
            html:'<p> Hi '+name+', Please click here to <a href="http://127.0.0.1:3000/verify?id='+user_id+'"> verify </a> your mail.</p> <br><br><b>Email:-</b>'+email+'<br><b>Password:-</b>'+password+''
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


const loadlogin = async(req,res)=>{
    try {
        res.render('login')
        
    } catch (error) {
        console.log(error.message);
    }
}

const  verifyLogin = async(req,res)=>{
    try {
        
        const email = req.body.email
        const password = req.body.password

        const userData = await User.findOne({email:email})
        if (userData) {

const passwordMatch = await bcrypt.compare(password,userData.password)
           if (passwordMatch) {
           if(userData.is_admin === 0){
            res.render('login',{message:"Email and password is incorrect"})
           }else{
            req.session.user_id = userData._id
            res.redirect("/admin/home")
           }  

                
            } else {
            res.render('login',{message:"Email and password is incorrect"})
                
            }


        } else {
            res.render('login',{message:"Email and password is incorrect"})
        }


    } catch (error) {
        console.log(error.message);
    }
}

const loadDashboard = async(req,res)=>{
    try {
        const userData = await User.findById({_id:req.session.user_id})
        res.render('home',{admin:userData})
    } catch (error) {
        console.log(error.message);
    }
}

const logout =async(req,res)=>{
    try {
        req.session.destroy()
        res.redirect('/admin')
    } catch (error) {
        console.log(error.message);
    }
}

const adminDasboard = async(req,res)=>{
    try {
    var search =''
    if(req.query.search){
        search=req.query.search
    }

    var page =1
    if(req.query.page){
        search=req.query.page
    }
    const limit = 2


    const usersData = await User.find({
        is_admin:0,
        $or:[
            {name:{$regex:'.*'+search+'.*',$options:'i'}},
            {email:{$regex:'.*'+search+'.*',$options:'i'}},
            {mobile:{$regex:'.*'+search+'.*',$options:'i'}}
        ]
    })
    
    res.render('dashboard',{users:usersData})

    } catch (error) {
        console.log(error.message);
    }
}

//add new users
const newUserLoad= async(req,res)=>{
    try {
        res.render('new-user')
    } catch (error) {
        console.log(error.message);
    }
}

const addUser = async(req,res)=>{
    try {
        const name = req.body.name
        const email = req.body.email
        const mno = req.body.mno
        const image = req.file.filename
        const password= randomstring.generate(8)
        const spassword = await securePassword(password)


        const user = new User({
            name:name,
            email:email,
            mobile:mno,
            image:image,
            password:spassword,
            is_verified:1,
            is_admin:0
        })

        const userData = await user.save()

        if (userData) {
            addUserMail(name,email,password,userData._id)
            res.redirect('/admin/dashboard')
        } else {
            res.render('new-user',{message:"Something wrong"})
            
        }


        
    } catch (error) {
        console.log(error.message);
    }
}
//edit user funcanctionality
 const editUserLoad= async(req,res)=>{
    try {
        const id= req.query.id
       const userData= await User.findById({_id:id})
       if (userData) {
        res.render('edit-user',{user:userData})        
       } else {
        res.redirect('/admin/dashboard')
       }
    } catch (error) {
        console.log(error.message);
    }
 }

 const updateUsers = async(req,res)=>{
    try {
      const userData = await User.findByIdAndUpdate({_id:req.body.id},{$set:{name:req.body.name,email:req.body.email,mobile:req.body.mno,is_verified:req.body.verify}})
        res.redirect('/admin/dashboard')
        } catch (error) {
        console.log(error.message);
    }
 }

 //delete users
 const deleteUser = async(req,res)=>{
    try {
        const id = req.query.id
        await User.deleteOne({_id:id})
        res.redirect('/admin/dashboard')
        
    } catch (error) {
        console.log(error.message);
    }
 }




module.exports={
    loadlogin,
    verifyLogin,
    loadDashboard,
    logout,
    adminDasboard,
    newUserLoad,
    addUser,
    editUserLoad,
    updateUsers,
    deleteUser
}