const express = require("express");
const mongoose = require("mongoose");
const logger = require("morgan");

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/workout";

const app = express();

app.use(logger("dev"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});
mongoose.connection.on("connected", () => {
  console.log(`MongoDB connected: ${MONGODB_URI}`);
});
mongoose.connection.on("error", err => {
  console.error("MongoDB connection error:", err.message);
});

// routes
require("./routes/html-routes.js")(app);
app.use(require("./routes/api-routes.js"));


app.listen(PORT, () => {
  console.log(`App running on port ${PORT}!`);
});
