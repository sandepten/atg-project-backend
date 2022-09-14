const mongoose = require("mongoose");
mongoose
  .connect(
    "mongodb+srv://sandepten:ypRJsFyYeaETa8G@sandclus.bbqqshl.mongodb.net/atg-project?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("db is connected"))
  .catch((err) => console.log(err));
