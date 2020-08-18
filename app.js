//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");

const app = express();
app.use(express.static("public"));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

//Set up default mongoose connection
const mongoDB = "mongodb://localhost:27017/my_database";
mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

//mongodb Schema for storing TaskItem
const itemSchema = {
  name: String,
};

//mongodb Schema for storing ListSchema
const listSchema = {
  name: String,
  items: [itemSchema],
};

const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

const welcomeItem = new Item({
  name: "Welcome to ToDoList",
});
const deleteMessage = new Item({
  name: "Click the CheckBox to Delete Task",
});
const addTaskMessage = new Item({
  name: "Write your Task and Click + button",
});

const defaultListItem = [welcomeItem, deleteMessage, addTaskMessage];

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      //inserting intem which list is empty
      Item.insertMany(defaultListItem, (err) => {
        if (!err) {
          console.log("inserted completely");
          res.redirect("/");
        }
      });
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.post("/", (req, res) => {
  const newItemDocument = new Item({
    name: req.body.newItem,
  });
  const listName = req.body.list;

  if (listName === "Today") {
    newItemDocument.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (error, listitm) => {
      listitm.items.push(newItemDocument);
      listitm.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const idToDelete = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(idToDelete, (err) => {
      if (!err) {
        console.log("Successfully delete");
        res.redirect("/");
      }
    });
  } else {
    //deleting Task from the list
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: idToDelete } } },
      (err, result) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const listItem = new List({
          name: customListName,
          items: defaultListItem,
        });
        listItem.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(port, function () {
  console.log("Server started on port " + port);
});
