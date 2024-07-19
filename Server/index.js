const express = require('express');
const mongoose = require('mongoose');
const bookroutes = require("./Routes/bookroutes");
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const errorHandler = require("./Middleware/errorHandler");
const cookieParser = require('cookie-parser');
const app = express();
dotenv.config();

mongoose.connect(process.env.database_url).then(()=>{
    console.log("DataBase Connected Successfully");
}).catch((error)=>{
    console.log(error);
})

app.use(express.json());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());
app.use(bookroutes);

app.use(errorHandler);
app.listen(process.env.PORT, ()=>{
    console.log("Backend Working");
})

