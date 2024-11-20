/*********************************************************************************
WEB322 – Assignment 04
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: 
Student ID: 
Date: 
Vercel Web App URL: 
GitHub Repository URL: 

********************************************************************************/ 

const express = require('express');
const path = require('path');
const storeService = require('./store-service');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'dejur7eyd',
  api_key: '531871793369284',
  api_secret: 'OMexcMP40GPMcRPZNuU1NEr23EQ',
  secure: true
});

// Multer configuration
const upload = multer();

const app = express();
const port = process.env.PORT || 8080;
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    '/' +
    (isNaN(route.split('/')[1])
      ? route.replace(/\/(?!.*)/, '')
      : route.replace(/\/(.*)/, ''));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.engine(
  '.hbs',
  exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
      navLink: function (url, options) {
        return (
          '<li class="nav-item"><a ' +
          (url === app.locals.activeRoute
            ? ' class="nav-link active"'
            : 'class="nav-link"') +
          ' href="' +
          url +
          '">' +
          options.fn(this) +
          '</a></li>'
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error('Handlebars Helper equal needs 2 parameters');
        if (lvalue !== rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      }
    }
  })
);

app.get('/', (req, res) => {
  res.redirect('/shop');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/shop', async (req, res) => {
  let viewData = {};

  try {
    let items = [];
    if (req.query.category) {
      items = await storeService.getPublishedItemsByCategory(req.query.category);
    } else {
      items = await storeService.getPublishedItems();
    }
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    let post = items.length > 0 ? items[0] : null;
    viewData.items = items;
    viewData.item = post;
  } catch (err) {
    viewData.message = 'no results';
  }

  try {
    let categories = await storeService.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = 'no results';
  }
  res.render('shop', { data: viewData });
});

app.get('/shop/:id', async (req, res) => {
  let viewData = {};

  try {
    let items = [];
    if (req.query.category) {
      items = await storeService.getPublishedItemsByCategory(req.query.category);
    } else {
      items = await storeService.getPublishedItems();
    }
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    viewData.items = items;
  } catch (err) {
    viewData.message = 'No results for items';
  }

  try {
    viewData.item = await storeService.getItemById(req.params.id);
    if (!viewData.item || !viewData.item.published) {
      viewData.message = `No results for item with ID: ${req.params.id}`;
    }
  } catch (err) {
    viewData.message = 'Error fetching item details';
  }

  try {
    let categories = await storeService.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = 'No results for categories';
  }

  res.render('shop', { data: viewData });
});

app.get('/items', (req, res) => {
  if (req.query.category) {
    storeService
      .getItemsByCategory(req.query.category)
      .then((data) => res.render('items', { items: data }))
      .catch((err) =>
        res.status(500).render('items', { message: 'no results', error: err })
      );
  } else if (req.query.minDate) {
    storeService
      .getItemsByMinDate(req.query.minDate)
      .then((data) => res.render('items', { items: data }))
      .catch((err) =>
        res.status(500).render('items', { message: 'no results', error: err })
      );
  } else {
    storeService
      .getAllItems()
      .then((data) => res.render('items', { items: data }))
      .catch((err) =>
        res.status(500).render('items', { message: 'no results', error: err })
      );
  }
});

app.get('/item/:id', (req, res) => {
  storeService
    .getItemById(req.params.id)
    .then((data) => res.json(data))
    .catch((err) => res.status(500).json({ message: err }));
});

app.get('/categories', (req, res) => {
  storeService
    .getCategories()
    .then((data) => res.render('categories', { categories: data }))
    .catch((err) =>
      res.status(500).render('categories', { message: 'no results', error: err })
    );
});

app.get('/items/add', (req, res) => {
  res.render('addItem');
});

app.post('/items/add', upload.single('featureImage'), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      return result;
    }

    upload(req)
      .then((uploaded) => {
        processItem(uploaded.url);
      })
      .catch((error) => {
        res.status(500).send('Image upload failed');
      });
  } else {
    processItem('');
  }

  function processItem(imageUrl) {
    req.body.featureImage = imageUrl;
    storeService
      .addItem(req.body)
      .then(() => {
        res.redirect('/items');
      })
      .catch((err) => {
        res.status(500).send(`Error adding item: ${err}`);
      });
  }
});

app.use((req, res) => {
  res.status(404).send('404: Page Not Found');
});

storeService
  .initialize()
  .then(() => {
    app.listen(port, () => {
      console.log(`Express http server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error(`Failed to initialize store service: ${err}`);
  });

module.exports = app;
