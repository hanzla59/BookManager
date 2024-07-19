const Book = require("../Models/book");
const BookDTO = require("../DTO/bookdto");
const JWTService = require("../Services/jwtServices");
const User = require("../Models/user");
const Token = require("../Models/token");
const dotenv = require('dotenv');
dotenv.config();

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
});


const uploadFile = async (filePath, folder) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'auto' // Automatically detect file type
        });
        return result;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
};



const bookController = ({

    //add book 
    async addBook(req, res, next) {
        try {
            const { token } = req.cookies;
            if (!token) {
                const error = {
                    status: 401,
                    message: "UnAuthorized Access"
                }
                return next(error);
            }
            let decodetoken;
            try {
                decodetoken = JWTService.verifyToken(token)
            } catch (error) {
                return next(error);
            }
            const { title, author, description, image, book } = req.body;
            const _id = decodetoken._id;
            const user = await User.findById({ _id: _id });

            // Validate input data
            if (!title || !author || !description || !image || !book) {
                return res.status(400).json({ message: "Incomplete Data" });
            }

            // Upload image to Cloudinary
            let imageResult;
            try {
                imageResult = await uploadFile(`data:image/png;base64,${image}`, 'images');
            } catch (uploadError) {
                console.error('Error uploading image:', uploadError);
                return res.status(500).json({ message: "Failed to upload image" });
            }

            const { secure_url, public_id } = imageResult;

            // Create new Book object
            const newBook = new Book({
                title,
                author,
                description,
                image: secure_url, // Store Cloudinary URL
                publicid: public_id, // Store Cloudinary public_id
                book,
                user
            });


            const bookDetail = await newBook.save();
            const bookDto = new BookDTO(bookDetail);
            return res.status(201).json({ message: "Book Added Successfully", book: bookDto });

        } catch (error) {

            console.error('Error adding book:', error);
            return res.status(500).json({ message: "Failed to add book", error: error.message });
        }
    },


    async getAllBook(req, res) {
        try {
            const allBooks = await Book.find({})
            const allbookdto = allBooks.map(book => new BookDTO(book));
            return res.status(201).json({ books: allbookdto })
        } catch (error) {
            return res.status(401).json(error);
        }
    },

    //mybook 
    async myBook(req, res, next) {
        const { token } = req.cookies;
        if (!token) {
            const error = {
                status: 401,
                message: "UnAuthorized Access"
            }
            return next(error);
        }
        let decodetoken;
        try {
            decodetoken = JWTService.verifyToken(token);
        } catch (error) {
            return next({
                status: 401,
                message: "UnAuthorized Access"
            })
        }
        try {

            const book_by_user = await Book.find({ user: decodetoken._id });
            if (book_by_user.length === 0) {
                return next({
                    status: 404,
                    message: "no book found by this user"
                })
            }
            else {
                const bookdto = book_by_user.map(book => new BookDTO(book));
                return res.status(201).json({ book: bookdto });
            }

        } catch (error) {
            return next(error);
        }

    },
    //there should be need id of that particular book for get, update and delete i need to update this
    //update the book
    async updateBook(req, res, next) {
        const { token } = req.cookies;
        if (!token) {
            const error = {
                status: 401,
                message: "UnAUthorized Access"
            }
            return next(error);
        }
        let decodetoken;
        try {
            decodetoken = JWTService.verifyToken(token);
        } catch (error) {
            return next(error);
        }

        try {
            const { title, author, description } = req.body;
            const { id } = req.params;
            const user_id = decodetoken._id;
            const book = await Book.findOne({ _id: id, user: user_id });
            if (!book) {
                const error = {
                    status: 401,
                    message: "UnAUthorized Access"
                }
                return next(error);
            }
            else {
                const updatefield = {};
                if (title) updatefield.title = title;
                if (author) updatefield.author = author;
                if (description) updatefield.description = description;

                const updated_book = await Book.findByIdAndUpdate(id, updatefield, { new: true });
                if (!updated_book) {
                    res.status(401).json("book not found");
                }
                else {
                    res.status(201).json({ message: "book Update Successfuly", book: updated_book });
                }

            }

        } catch (error) {
            return res.status(401).json(error);
        }
    },

    //delete the book
    async deleteBook(req, res, next) {
        try {
            const { token } = req.cookies;
            if (!token) {
                const error = {
                    status: 401,
                    message: "UnAUthorized Access"
                }
                return next(error);
            }
            let decodeToken;
            try {
                decodeToken = JWTService.verifyToken(token);
            } catch (error) {
                return next(error);
            }

            const { id } = req.params;
            const user_id = decodeToken._id;


            const delete_book = await Book.findById({ _id: id });
            if (!delete_book) {
                res.status(401).json("Book not found");
            }
            else {
                try {
                    const book = await Book.findOne({ _id: id, user: user_id });
                    if (!book) {
                        const error = {
                            status: 401,
                            message: "UnAUthorized Access"
                        }
                        return next(error);
                    }
                    else {
                        await cloudinary.uploader.destroy(delete_book.publicid);
                        await Book.findByIdAndDelete({ _id: id });
                        res.status(201).json("Book Delete Successfully");
                    }
                } catch (error) {
                    res.status(401).json("error to delete image from cloudinary")
                }
            }

        } catch (error) {
            return res.status(401).json(error);
        }
    }
})

module.exports = bookController;