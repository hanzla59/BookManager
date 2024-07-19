class BookDTO{
    constructor(Book){
        this.id = Book.id;
        this.title = Book.title;
        this.author = Book.author;
        this.description = Book.description;
        this.image = Book.image;
        this.book  = Book.book;
        this.postedby = Book.user ? Book.user.toString() : null;;
    }
}

module.exports = BookDTO;