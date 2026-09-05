const express=require('express');
const app=express();

app.get('/',function(req,res){
    res.send("hey hi welcome to our website");
})

app.get('/about',function(req,res){
    res.send("About us nothing to tell you");
});

app.get('/contact',(req,res)=>{
    res.send("Contacy us at: 1234567890");
})

app.get('/services',(req,res)=>{
    var services={
        name:"web development",
        price:1000,
        duration:"1 month"
    };
    res.send(services);
})

app.post('/items',(req,res)=>{
    res.send("item added successfully");
})



app.listen(3000,function(){
    console.log("server is running on port 3000");
});