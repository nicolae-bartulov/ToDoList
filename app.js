//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const date = require(__dirname + "/date.js");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://nbartulov:Volutrab3.Atla@cluster0.krbvlwc.mongodb.net/todolistDB");

//Mongoose Schemas
const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Cannot be empty!"]
  }
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

//Mongoose Models

const Item = mongoose.model(
  "Item",
  itemsSchema
);

const List = mongoose.model(
  "List",
  listSchema
);

//Default Items

const vacuum = new Item({
  name: "Welcome to your ToDO List"
});

const learn = new Item({
  name: "Hit + to add a new task."
});

const tv = new Item({
  name: "<-   Check to delete task"
});

const defaultItems = [vacuum, learn, tv];

// const result = Item.insertMany(defaultItems);
// console.log(result.insertedCount);

async function findItems(){
  const itemsCollection = Item.find();
  const itemsFromDb = await itemsCollection.exec();
  return itemsFromDb;

}

const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.get("/", function(req, res) {

// const day = date.getDate();
  findItems().then(function(FoundItems){
    if(FoundItems.length === 0){
      Item.insertMany(defaultItems);
    } else{
      res.render("list", {listTitle: "Today", newListItems: FoundItems});
    }

    })
  });


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  if(itemName.length !== 0){
    const item = new Item({
      name: itemName
    });
  
    if(listName === "Today"){
      item.save();
      res.redirect("/");
    } else{
      List.findOne({name: listName}).then(function(foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
    }
  } else{
    console.log("Empty item!");
  }
});

app.post("/delete", function(req, res){
  const checkItemId = req.body.delete;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.deleteOne({_id: checkItemId}).then(function(result){
      console.log(result.deletedCount);
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkItemId}}},{new: true}).then(function(result){
      console.log(result);

    });
    res.redirect("/" + listName);
  }
});

app.get("/:listId", function(req,res){
  var customListName = req.params.listId;
  customListName = _.capitalize(customListName);

  List.findOne({name: customListName}).exec().then(function(result, error){

    if(result !== null){
      res.render("list", {listTitle: result.name, newListItems: result.items});
    //Show existing list
    } else{
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
