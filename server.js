require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
//// mains 
const app = express();
const PORT = process.env.PORT || 3000;
const client = new pg.Client(process.env.DATABASE_URL)
///// uses 
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public')); 
app.set('view engine', 'ejs');
///// listen 
client.connect()
.then(()=>{
    app.listen(PORT,()=>{
        console.log('i am running');
    })
})
//////routs
app.get(notFoundHandler)
app.get(errorHandler)
app.get('/',indexHandler)
app.get('/search',searchHandler)
app.get('/add',addHandler)
app.get('/favorite',favHandler)
app.get('/details/:id',detailsHandler)
app.put('/update/:id',updateHandler)
app.delete('/delete/:id',deleteHandler)
//// routs handler
function indexHandler(req,res){
    res.render('index')
}
/////searchHandler
function searchHandler (req,res){
    let {searchBy,keyword}=req.query
    let url = `https://www.googleapis.com/books/v1/volumes?q=${keyword}+in${searchBy}:${keyword}`;
    superagent.get(url)
    .then(result=>{
        let books = result.body.items.map(val=>{
            return new Books(val)
            
        })
        res.render('result',{data:books})
    })
}

/////////////////////////favHandler
function favHandler (req,res){
    let sql = 'SELECT * FROM books'
    client.query(sql)
    .then(result =>{
        res.render('favorit',{data:result.rows})
    })
}

////////////////addHandler
function addHandler (req,res){
    let {title,authors,description,img}=req.query
    // console.log(req.query);
    let sql = 'INSERT INTO books (title,authors,description,img) VALUES ($1,$2,$3,$4)';
    let safeval = [title,authors,description,img];
    client.query(sql,safeval)
    .then(()=>{
        res.redirect('/favorite')
    })
    
}

///////////////////detailsHandler
function detailsHandler(req,res){
    let param = req.params.id;
    let sql = 'SELECT * FROM books WHERE id=$1';
    let safevalues = [param]
    client.query(sql,safevalues)
    .then(result=>{
        res.render('details',{data:result.rows[0]})
    })
}

///////////////updateHandler
function updateHandler (req,res){
    let param = req.params.id;
    let {title,authors,description,img} = req.body
    console.log(req.body);
    let sql = `UPDATE books
    SET title = $1, authors = $2, description= $3,img=$4
    WHERE id = $5;`
    let safevalues = [title,authors,description,img,param]
    client.query(sql,safevalues)
    .then(()=>{
        res.redirect(`/details/${param}`)
    })
}

//////////////deleteHandler 
function deleteHandler (req,res){
    let param = req.params.id;
    console.log(req.body);
    let sql = `DELETE FROM books WHERE id=$1`
    let safevalues = [param]
    client.query(sql,safevalues)
    .then(()=>{
        res.redirect(`/favorite`)
    })
}


function Books(val) {
this.title = val.volumeInfo.title
this.authors = val.volumeInfo.authors
this.description = val.volumeInfo.description
this.img = val.volumeInfo.imageLinks.thumbnail;

}

///// error hand
function notFoundHandler (req,res){
    res.status(404).send('page not found')
}

function errorHandler(err,req,res){
    res.status(500).send(err)
}