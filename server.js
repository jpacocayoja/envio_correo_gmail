/* para el servidor de correo
  user: "urianwebdeveloper@gmail.com",
  pass: "tcgsaaiuilyreuzc", 
  */

//Importando el módulo 'express'
const express = require("express");
const bodyParser = require("body-parser");

//Importando la biblioteca nodemailer en tu archivo
const nodemailer = require("nodemailer");

//importando el modulo multer para manejar la carga de archivos
const multer = require("multer");

//Inicializamos Express.
const app = express();
const path = require("path");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


//Definimos el Puerto
const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

/**
 * app.use Se utiliza para montar middlewares en la aplicación Express.
 * Los middlewares son funciones que se ejecutan en el flujo de procesamiento de una solicitud antes
 * de que se envíe una respuesta Middleware para servir archivos estáticos desde la carpeta "public"
 */
app.use("/public", express.static(path.join(__dirname, "public")));


//Establecer EJS como el Motor de plantillas 
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "files_emails")); // Ruta donde se guardarán los archivos adjuntos
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });


//Creamos una funcion del servicio de email
function createTransporter(servicio, usuario, password) {
  return nodemailer.createTransport({
    service: servicio,
    auth: {
      user: usuario,
      pass: password
    }
  });
}

//Definimos las rutas
app.get("/", (req, res) => {
  res.render("inicio");
});

app.post("/procesar-email", upload.single("fileAdjunto"), (req, res) => {
  try {
    const { desde, para, titulo, mensaje, servicio, usuario, password } = req.body;
    const fileAdjunto = req.file;

    let attachments = [];
    if (fileAdjunto) {
      const filePath = path.join(__dirname, "files_emails", fileAdjunto.filename);
      attachments = [{ filename: fileAdjunto.name, path: filePath }];
    }

    const mailOptions = {
      from: "",
      to: para,
      subject: titulo,
      text: mensaje,
      attachments: attachments,
    };

    //se llama a la funcion para definir las credenciales del servio email
    const transporter = createTransporter("gmail", usuario, password);

    //ejecuta el servicio para el envio de correo
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error al enviar correo:", error);
        // Si hay un error, enviar una respuesta JSON indicando el fallo
        return res.status(500).json({
          success: false,
          message: "No se pudo enviar el correo. Por favor, verifique las credenciales y la configuración del servidor SMTP.",
          error: error.message
        });
      }
      console.log("Correo enviado:", info.response);
      // En caso de éxito, enviar una respuesta JSON indicando el éxito
      res.json({
        success: true,
        message: "Correo enviado exitosamente."
      });
    });
  } catch (error) {
    console.error("Error durante la preparación o configuración del correo:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor: " + error.message
    });
  }
});



