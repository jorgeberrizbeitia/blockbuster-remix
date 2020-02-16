const express = require("express");
const profileRouter = express.Router();
const User = require("./../models/User"); // for future use in setting the current user ID
const GameForRent = require("./../models/GameForRent");
const axios = require("axios");

// GET after selecting game from list, auto populate game title and platform fields
profileRouter.get("/game-add-search/:gameTitle/:gamePlatform", (req, res) => {
  let gameTitle = req.params.gameTitle;
  let gamePlatform = req.params.gamePlatform;
  const data = {
    gameTitle: gameTitle,
    gamePlatform: gamePlatform
  };
  res.render("profile", data);
});

// POST to get preliminary videogame search results
profileRouter.post("/", (req, res) => {
  const { game } = req.body;

  axios({
    method: "GET",
    url: "https://chicken-coop.p.rapidapi.com/games",
    headers: {
      "content-type": "application/octet-stream",
      "x-rapidapi-host": "chicken-coop.p.rapidapi.com",
      "x-rapidapi-key": "ebde97877cmsh57d04785db64b6cp1c30f0jsn986c5e407a9c"
    },
    params: {
      title: `${game}`
    }
  })
    .then(response => {
      console.log("DATA GOT", response.data.result);
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
profileRouter.post("/game-add-search", (req, res) => {
  // deconstruct of videogame form
  const { title, platform, price, minDays, maxDays } = req.body;

  // switch case to fix platform field format because this API is SpECiaL ¬¬
  let platformCorrected = "";
  switch (platform) {
    case "Switch":
      platformCorrected = "switch";
      break;
    case "Wii":
      platformCorrected = "wii";
      break;
    case "WiiU":
      platformCorrected = "wii-u";
      break;
    case "GameCube":
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
      "x-rapidapi-key": "ebde97877cmsh57d04785db64b6cp1c30f0jsn986c5e407a9c"
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
        gameAPIRef: response[0].data.query,
        gameOwnerRef: "5e4567f0b0397ad48473dc98", // PLACEHOLDER. ID NEEDS TO BE ASSIGNED FROM CURRENT USER
        title: response[0].data.result.title,
        platform,
        price,
        minDays,
        maxDays,
        isAvailable: true
      });
      return pr;
    })
    .then(gameForRent => {
      console.log(`Game "${gameForRent.title}" created in DB`);
      console.log("GAME CREATED", gameForRent);
      res.redirect("/profile");
    })
    .catch(error => {
      console.log(error);
    });
});

// GET render profile
profileRouter.get("/", (req, res, next) => {
  GameForRent.find()
    .then(allGames => {
      const data = {
        games: allGames
      };
      res.render("profile", data);
    })
    .catch(err => console.log(err));
});

module.exports = profileRouter;
