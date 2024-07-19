const { required } = require('joi');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const BookSchema = new Schema({
    title:{
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true
    },
    publicid:{
        type: String,
        required: true
    },
    book:{
        type: String,
        required: true
    },
    user:{
        type:mongoose.SchemaTypes.ObjectId,
        ref:'User'
    }
},{timestamps: true});

const Book = mongoose.model('Book', BookSchema);

module.exports = Book;