const bcrypt = require("bcrypt-nodejs");
const User = require("../models/user.model");
const jwt = require("../services/jwt");

function signUp(req, res) {
  const user = new User();
  const { email, password, repeatPassword } = req.body;
  user.email = email;
  /* Por default almacenamos el rol y si es un usuario activo o no */
  user.role = "admin";
  user.active = true;
  /* Si no existe una de las dos password */
  if (!password || !repeatPassword) {
    res.status(404).send({ message: "Las contraseñas son obligatorias" });
  } else {
    if (password !== repeatPassword) {
      res.status(404).send({ message: "Las contraseñas no coinciden" });
    } else {
      bcrypt.hash(password, null, null, (err, hash) => {
        /* No funciono la encriptación */
        if (err) {
          res
            .status(500)
            .send({ message: "Error al encriptar la contraseña." });
        } else {
          user.password = hash;
          user.save((err, userStored) => {
            if (err) {
              res.status(500).send({ message: "El usuario ya existe." });
            } else {
              if (!userStored) {
                res.status(404).send({ message: "Error al crear el usuario." });
              } else {
                res.status(200).send({ user: userStored });
              }
            }
          });
        }
      });
    }
  }
}


const signIn = (req, res)=> {
  console.log("Login correcto");
  const params = req.body;
  const email = params.email.toLowerCase();
  const password = params.password;
  User.findOne({ email }, (err, userStored) => {
    if (err) {
      res.status(500).send({ message: "Error del servidor" });
    } else {
      if (!userStored) {
        res.status(404).send({ message: "Usuario no encontrado" });
      } else {
        bcrypt.compare(password, userStored.password, (err, check) => {
          if (err) {
            res.status(500).send({ message: "Error del servidor" });
          } else if (!check) {
            res.status(404).send({ message: "La constraseña es incorrecta" });
          } else {
            if (!userStored.active) {
              res
                .status(200)
                .send({code: 200, message: "El usuario no se ha activado" });
            } else {
              res.status(200).send({
                accessToken: jwt.createAccessWithToken(userStored),
                refreshToken: jwt.createRefreshToken(userStored),
              });
            }
          }
        });
      }
    }
  });
};

module.exports = { signUp, signIn };