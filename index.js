const express =require('express');
const cors=require('cors');
const app=express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

//resaleServer
//GH9GfzYN44zmAti1

app.get('/',(req,res) =>{
    res.send('Resale server Running');
})

app.listen(port,()=>{
    console.log(`Simple server running on port ${port}`);
})