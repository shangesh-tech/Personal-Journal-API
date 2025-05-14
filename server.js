const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const Router = require("./route");
const dotenv = require("dotenv");
dotenv.config();

const app = express();  


app.use(cors());
app.use(express.json());
app.use(cookieParser());

//routes

app.use("/api", Router);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
