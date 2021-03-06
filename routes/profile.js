const express = require("express");
const profileRouter = express.Router();
const User = require("./../models/User");
const GameForRent = require("./../models/GameForRent");
const axios = require("axios");

// GET after selecting game from list, render game-add-form and auto populate game title and platform fields
profileRouter.get("/game-add-form/:gameTitle/:gamePlatform", (req, res) => {
  let gameTitle = req.params.gameTitle;
  let gamePlatform = req.params.gamePlatform;
  GameForRent.find({ gameOwnerRef: req.session.currentUser._id })
    .then(allGames => {
      const data = {
        games: allGames,
        gameTitle: gameTitle,
        gamePlatform: gamePlatform
      };
      res.render("game-add-form", data);
    })
    .catch(err => console.log(err));
});

// POST to get preliminary videogame search results and render game-add-search
profileRouter.post("/", (req, res) => {
  const { game } = req.body;

  axios({
    method: "GET",
    url: "https://chicken-coop.p.rapidapi.com/games",
    headers: {
      "content-type": "application/octet-stream",
      "x-rapidapi-host": "chicken-coop.p.rapidapi.com",
      "x-rapidapi-key": process.env.CLIENT_KEY
    },
    params: {
      title: `${game}`
    }
  })
    .then(response => {
      const data = {
        games: response.data.result
      };
      res.render("game-add-search", data);
    })
    .catch(error => {
      console.log(error);
    });
});

// POST from full videogame form to add a game available for rent
profileRouter.post("/game-add-form", (req, res) => {
  // deconstruct of videogame form
  const { title, platform, price, minDays, maxDays } = req.body;

  // switch case to fix platform field format because this API is SspECiaL ¬¬
  let platformCorrected = "";
  switch (platform) {
    case "Switch":
      platformCorrected = "switch";
      break;
    case "WII":
      platformCorrected = "wii";
      break;
    case "WIIU":
      platformCorrected = "wii-u";
      break;
    case "GC":
      platformCorrected = "gamecube";
      break;
    case "N64":
      platformCorrected = "nintendo-64";
      break;
    case "3DS":
      platformCorrected = "3ds";
      break;
    case "DS":
      platformCorrected = "ds";
      break;
    case "PS4":
      platformCorrected = "playstation-4";
      break;
    case "PS3":
      platformCorrected = "playstation-3";
      break;
    case "PS2":
      platformCorrected = "playstation-2";
      break;
    case "PS":
      platformCorrected = "playstation";
      break;
    case "PSP":
      platformCorrected = "psp";
      break;
    case "VITA":
      platformCorrected = "playstation-vita";
      break;
    case "PC":
      platformCorrected = "pc";
      break;
    case "XONE":
      platformCorrected = "xbox-one";
      break;
    case "Xbox 360":
      platformCorrected = "xbox-360";
      break;
    case "Xbox":
      platformCorrected = "xbox";
      break;
  }

  // to get response from videogame DB API
  const gameReqPr = axios({
    method: "GET",
    url: `https://chicken-coop.p.rapidapi.com/games/${title}`,
    headers: {
      "content-type": "application/octet-stream",
      "x-rapidapi-host": "chicken-coop.p.rapidapi.com",
      "x-rapidapi-key": process.env.CLIENT_KEY
    },
    params: {
      platform: `${platformCorrected}`
    }
  });

  // to create gameForRent after all pr are fulfilled. Currently only one.
  Promise.all([gameReqPr])
    .then(response => {
      console.log("GAME DATA", response[0].data);
      const pr = GameForRent.create({
        gameOwnerRef: req.session.currentUser._id, // Game owner Id referenced in Game
        title: response[0].data.result.title,
        platform: platformCorrected,
        image: response[0].data.result.image,
        price,
        minDays,
        maxDays,
        isAvailable: true
      });
      return pr;
    })
    .then(gameForRent => {
      console.log(`Game "${gameForRent.title}" created in DB`);
      res.redirect("/profile");
    })
    .catch(error => {
      console.log(error);
    });
});

// POST to delete games for rent
profileRouter.post("/delete/:gameId", (req, res) => {
  GameForRent.findByIdAndRemove(req.params.gameId)
    .then(() => res.redirect("/profile"))
    .catch(err => console.log(err));
});

// POST to edit games for rent
profileRouter.get("/edit/:gameId", (req, res) => {
  GameForRent.findById(req.params.gameId)
    .then((gameData) => {
      res.render("edit-form", gameData);
    })
    .catch(err => console.log(err));
});

profileRouter.post("/edit/:gameId", (req, res) => {
  const { price, minDays, maxDays } = req.body
  console.log(req.body)
  GameForRent.findByIdAndUpdate(req.params.gameId, { price, minDays, maxDays })
  .then( (data) => res.redirect("/profile"))
  .catch( (err) => console.log(err));
})

profileRouter.post("/available/:gameId", (req, res) => {
  GameForRent.findByIdAndUpdate(req.params.gameId, { isAvailable: true })
  .then( (data) => res.redirect("/profile"))
  .catch( (err) => console.log(err));
})

// GET render profile
profileRouter.get("/", (req, res) => {
  // find all games from current active user
  GameForRent.find({ gameOwnerRef: req.session.currentUser._id })
    .then(allGames => {
      console.log(allGames);
      const data = {
        games: allGames,
        nickname: req.session.currentUser.nickname
      };
      res.render("profile", data);
    })
    .catch(err => console.log(err));
});

module.exports = profileRouter;
