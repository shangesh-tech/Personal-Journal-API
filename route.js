const express = require("express");
const Router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authMiddleware = require("./auth_middleware");

const JWT_SECRET = process.env.JWT_SECRET ;


// Mock DB
const USER_DATA = [];
const JOURNAL_DATA = [];

// Register Route
Router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const userExists = USER_DATA.find((user) => user.username === username);

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    USER_DATA.push({ username, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login Route
Router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = USER_DATA.find((user) => user.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ username }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
    });

    res.status(200).json({ message: "Login successful", user: { username } });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create Journal
Router.post("/journal", authMiddleware, (req, res) => {
  try {
    const { title, content } = req.body;

    const newJournal = {
      id: JOURNAL_DATA.length + 1,
      title,
      content,
      username: req.username,
      createdAt: new Date().toISOString(),
    };

    JOURNAL_DATA.push(newJournal);

    res.status(201).json({ message: "Journal created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get User Journals
Router.get("/journal", authMiddleware, (req, res) => {
  try {
    const userJournals = JOURNAL_DATA.filter(
      (journal) => journal.username === req.username
    );
    res
      .status(200)
      .json({ message: "Journals fetched successfully", userJournals });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

Router.get("/journal/search", authMiddleware, (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const searchResults = JOURNAL_DATA.filter(
      (journal) =>
        journal.username === req.username &&
        journal.title.toLowerCase().includes(query.toLowerCase())
    );

    res.status(200).json({ message: "Journal search results", searchResults });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update Journal
Router.put("/journal/:id", authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body

    const index = JOURNAL_DATA.findIndex((j) => j.id === parseInt(id));
    if (index === -1)
      return res.status(404).json({ message: "Journal not found" });

    if (JOURNAL_DATA[index].username !== req.username) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    JOURNAL_DATA[index].title = title;
    JOURNAL_DATA[index].content = content;

    res.status(200).json({ message: "Journal updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete Journal
Router.delete("/journal/:id", authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const index = JOURNAL_DATA.findIndex((j) => j.id === parseInt(id));
    if (index === -1)
      return res.status(404).json({ message: "Journal not found" });

    if (JOURNAL_DATA[index].username !== req.username) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    JOURNAL_DATA.splice(index, 1);
    res.status(200).json({ message: "Journal deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = Router;
