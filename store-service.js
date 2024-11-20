const fs = require("fs");
const path = require("path");

let items = []; // array to store items object array in items.json
let categories = []; // array to store categories object array in categories.json

// Functions to be exported and imported in server.js

// This function will read the contents of the "./data/items.json" file
function initialize() {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.join(__dirname, "data", "items.json"),
      "utf8",
      (err, data) => {
        if (err) {
          reject("unable to read file items.json");
          return;
        }

        try {
          items = JSON.parse(data);
        } catch (parseError) {
          reject("unable to parse items.json");
          return;
        }
      }
    );

    fs.readFile(
      path.join(__dirname, "data", "categories.json"),
      "utf8",
      (err, data) => {
        if (err) {
          reject("unable to read file categories.json");
          return;
        }

        try {
          categories = JSON.parse(data);
          resolve();
        } catch (parseError) {
          reject("unable to parse categories.json");
        }
      }
    );
  });
}

function getAllItems() {
  return new Promise((resolve, reject) => {
    if (items.length === 0) {
      reject("no results returned");
    } else {
      resolve(items);
    }
  });
}

function getPublishedItems() {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter((item) => item.published);
    if (publishedItems.length === 0) {
      reject("no results returned");
    } else {
      resolve(publishedItems);
    }
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    if (categories.length === 0) {
      reject("no results returned");
    } else {
      resolve(categories);
    }
  });
}

function addItem(itemData) {
  return new Promise((resolve, reject) => {
    if (itemData.published === undefined) {
      itemData.published = false;
    } else {
      itemData.published = true;
    }
    const newItem = {
      id: items.length + 1,
      category: itemData.category,
      postDate: new Date().toISOString().split("T")[0],
      featureImage: itemData.featureImage,
      price: parseFloat(itemData.price).toFixed(2) || itemData.price,
      title: itemData.title,
      body: itemData.body,
      published: itemData.published,
    };
    items.push(newItem);
    resolve(newItem);
  });
}

// New function to get items by category
function getItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    const filteredItems = items.filter(item => item.category == category);
    if (filteredItems.length === 0) {
      reject("no results returned");
    } else {
      resolve(filteredItems);
    }
  });
}

// New function to get items by minimum date
function getItemsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    const filteredItems = items.filter(item => new Date(item.postDate) >= new Date(minDateStr));
    if (filteredItems.length === 0) {
      reject("no results returned");
    } else {
      resolve(filteredItems);
    }
  });
}

// New function to get item by id
function getItemById(id) {
  return new Promise((resolve, reject) => {
    const item = items.find(item => item.id == id);
    if (!item) {
      reject("no result returned");
    } else {
      resolve(item);
    }
  });
}

function getPublishedItemsByCategory(category){
  return new Promise((resolve, reject) => {
      const publishedItemsByCategory = items
          .filter((item) => item.category == category && item.published == true);
      if (publishedItemsByCategory.length > 0) {
          resolve(publishedItemsByCategory);
      } else {
          reject("no results returned");
      }
  });
}

// Exporting all the functions in this module
module.exports = {
  addItem,
  initialize,
  getAllItems,
  getPublishedItems,
  getCategories,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  getPublishedItemsByCategory
};
