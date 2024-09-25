const express = require("express");
const path = require("path");
const User = require("./config"); // Import the User model
const bcrypt = require("bcrypt");
const passport = require("passport");
const multer = require('multer'); // Ensure multer is imported

const Resume = require('./resume'); // Import the Resume model

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const app = express();

app.use('/images', express.static(path.join(__dirname, 'images')));

app.set('view engine', 'ejs');
require('dotenv').config();

// Configure Passport
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:5100/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await User.findOne({ googleId: profile.id });
    if (user) {
      return done(null, user);
    } else {
      const newUser = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        googleId: profile.id,
      });
      await newUser.save();
      return done(null, newUser);
    }
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: "your-secret", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/resume", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  res.render("resume");
});
app.get("/upload", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  res.render("upload");
});

app.get("/enhance", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  res.render("enhance");
});


app.get("/newresume", (req, res) => {
  res.render("newresume");
});
app.get("/contactdetails", (req, res) => {
  res.render("contactdetails");
});

// Home Route with Authentication Check
app.get("/home", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  const username = req.user.name;
  res.render("home", { username });
});

app.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

// Google OAuth Routes
app.get("/auth/google", passport.authenticate("google", {
  scope: ["profile", "email"]
}));

app.get("/auth/google/callback", passport.authenticate("google", {
  failureRedirect: "/login"
}), (req, res) => {
  res.redirect(`/home`);
});

// Register User
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render("login", { errorMessage: "Passwords do not match." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("login", {
        errorMessage: "User already exists. Please choose a different email.",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.render("login", {
      successMessage: "Registration successful! Please log in.",
    });
  } catch (err) {
    res.render("login", { errorMessage: "An error occurred. Please try again." });
  }
});

// Login User
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.render("login", { errorMessage: "User not found. Please sign up first." });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.render("login", { errorMessage: "Incorrect password. Please try again." });
    }

    // Log in the user using Passport
    req.login(user, (err) => {
      if (err) {
        return res.render("login", { errorMessage: "An error occurred. Please try again." });
      }
      res.redirect(`/home`);
    });
  } catch (err) {
    res.render("login", { errorMessage: "An error occurred. Please try again." });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Middleware for parsing JSON
app.use(express.json());

// Upload route
app.post('/upload', (req, res) => {
  console.log('Request body:', req.body); // Log the request body

  const resume = new Resume({
      resumePath: req.body.resumePath,
      imagePath: req.body.imagePath,
      paymentScreenshotPath: req.body.paymentScreenshotPath,
      resumeType: req.body.resumeType
  });

  resume.save()
  .then(() => {
      console.log('Resume saved:', resume); // Log the saved resume
      res.status(201).send('Resume uploaded successfully');
  })
  .catch(err => {
      console.error('Error saving resume:', err); // Log the error
      res.status(500).send('Error saving resume: ' + err);
  });
});

// Define Port
const port = 5100;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
