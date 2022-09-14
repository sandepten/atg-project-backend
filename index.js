const express = require("express");
require("dotenv").config();
const cors = require("cors");
require("./db");
const userRouter = require("./routes/user");
const app = express();
const PORT = process.env.PORT || 8000;
app.use(cors());
app.use(express.json());
app.use("/api/user", userRouter);

app.get("/", (req, res) => {
  res.send("hello home page");
});

app.listen(PORT, () => {
  console.log("app is running");
});
