const express = require('express');
const router = express.Router()
const bookController = require("../Controllers/bookController");
const userController = require("../Controllers/userController");
const auth = require("../Middleware/auth");

router.get("/", (req,res)=>{
    res.status(201).json({message: "Welcome to Book Manager App"});
})

//user routes
router.post("/register", userController.register);
router.get("/alluser", userController.getAlluser);
router.get("/user", userController.getById);
router.post("/login", userController.login);
router.put("/user/update", auth, userController.update);
router.get("/logout", auth , userController.logout);
router.delete("/user/delete", userController.delete);



//book routes
router.post("/addBook",auth, bookController.addBook);
router.get("/allbook", bookController.getAllBook);
router.get("/mybook", auth, bookController.myBook);
router.put("/book/:id",auth, bookController.updateBook);
router.delete("/book/:id",auth, bookController.deleteBook);



module.exports = router;