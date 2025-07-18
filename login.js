import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDoc,
    getDocs,
    setDoc,
    doc
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
$(function () {
    const firebaseConfig = {
        apiKey: "AIzaSyACXm8_LRfsRwSOZwQ-RtkN6JrggEpd5K4",
        authDomain: "votaciones-online-fb685.firebaseapp.com",
        projectId: "votaciones-online-fb685",
        storageBucket: "votaciones-online-fb685.firebasestorage.app",
        messagingSenderId: "1007029717801",
        appId: "1:1007029717801:web:98852cad85300266aa4538",
        measurementId: "G-DYL7827YJF"
    };
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    // =========================
    //APARTADO: Registrarse
    // =========================
    var caracteresProhibidos = ["/", ".", ":", "*", "[", "]", "`", "'", " "];
    $("#Registrarse").click(async function () {
        var usuarioRegistro = $("#usuarioRegistro").val().toLowerCase();
        var usuarioOriginal = $("#usuarioRegistro").val();
        var contrasenyaRegistro = $("#contrasenyaRegistro").val();
        var usuarioDivididoCaracteres = usuarioRegistro.split("");
        var usuarioValido = comprobarCaracteresUsuario(usuarioDivididoCaracteres);
        var contrasenyaValida = true;
        if ($("#usuarioRegistro").val() == "" || $("#contrasenyaRegistro").val() == "") {
            mensajeParaError("Tienes que rellenar todos los campos, no los puedes dejar vacios");
        }

        else {
            if (contrasenyaRegistro.length < 8) {
                contrasenyaValida = false;
            }

            if (!usuarioValido) {
                mensajeParaError("El usuario no tiene los caracteres permitidos o tiene menos de 4 caracteres");
            }

            else {
                var usuarioExiste = await comprobarUsuarioExiste(usuarioRegistro);
                if (usuarioExiste) {
                    mensajeParaError("El usuario ya existe, si eres tú inicia sesión");
                }

                else if (!contrasenyaValida) {
                    mensajeParaError("La contraseña no tiene 8 caracteres o más");
                }
            }
        }

        if (contrasenyaValida && usuarioValido && !usuarioExiste) {
            await crearusuario(usuarioRegistro, contrasenyaRegistro, usuarioOriginal);
            $("#pantallaRegistro").hide();
            $("#pantallaInicioSesion").show();
        }
    });
    // =========================
    //AQUI ACABA EL APARTADO: Registrarse
    // =========================

    // =========================
    //APARTADO: Iniciar sesion
    // =========================

    $("#usuarioLogin, #contrasenyaLogin").keydown(function(e) {
        var tecla = e.key;
        if (tecla == "Enter") {
            iniciarSesion();
        }
    });

    $("#IniciarSesion").click(function () {
        iniciarSesion();
    });

    async function iniciarSesion() {
        var usuarioLogin = $("#usuarioLogin").val().toLowerCase();
        var contrasenyaLogin = $("#contrasenyaLogin").val();
        if ($("#usuarioLogin").val() == "" || $("#contrasenyaLogin").val() == "") {
            mensajeParaError("Tienes que rellenar todos los campos, no los puedes dejar vacios");
        }

        else {
            var usuarioExiste = await comprobarUsuarioExiste(usuarioLogin);
            if (!usuarioExiste) {
                mensajeParaError("El usuario no existe, si no tiene cuenta registrese");
            }

            else {
                var { contrasenyaCorrecta, usuario } = await comprobarContrasenya(contrasenyaLogin, usuarioLogin);

                if (contrasenyaCorrecta) {
                    //Cambiar de pantalla
                    sessionStorage.setItem("usuario", usuario);
                    window.location.href = "home.html";
                    console.log(`Bienvenido al sistema ${usuario}`);
                }

                else {
                    mensajeParaError("La contraseña es incorrecta");
                }
            }
        }
    }

    // =========================
    //AQUI ACABA EL APARTADO: Iniciar sesion
    // =========================

    // =========================
    //APARTADO: Cambio de pantallas
    // =========================

    $("#Registrarse_InicioSesion").click(function () {
        $("#pantallaInicioSesion").hide();
        $("#pantallaRegistro").show();
    });

    $("#IniciarSesion_Registro").click(function () {
        $("#pantallaRegistro").hide();
        $("#pantallaInicioSesion").show();
    });

    // =========================
    //AQUI ACABA EL APARTADO: Cambio de pantallas
    // =========================

    function comprobarCaracteresUsuario(usuarioComprobar) {
        if (usuarioComprobar.length < 4) {
            return false;
        }

        for (var i = 0; i < usuarioComprobar.length; i++) {
            if (caracteresProhibidos.includes(usuarioComprobar[i])) {
                return false;
            }

            if (usuarioComprobar[i] == "_" && usuarioComprobar[i + 1] == "_" && usuarioComprobar[usuarioComprobar.length - 1] == "_" && usuarioComprobar[usuarioComprobar.length - 2] == "_") {
                return false;
            }
        }
        return true;
    }

    async function comprobarUsuarioExiste(usuarioComprobar) {
        var referencia = doc(db, "usuarios", usuarioComprobar);
        var documento = await getDoc(referencia);
        return documento.exists();
    }

    async function crearusuario(usuario, contrasenya, nombreOriginal) {
        var referencia = doc(db, "usuarios", usuario);
        contrasenya = await hashearContrasenya(contrasenya);
        await setDoc(referencia, {
            contrasenya: contrasenya,
            usuario: nombreOriginal,
        });
    }

    function mensajeParaError(mensaje) {
        $(".mensajeError").show();
        $(".mensajeError").text(mensaje);
        setTimeout(function () {
            $(".mensajeError").text("");
            $(".mensajeError").hide();
        }, 3000);
    }

    async function hashearContrasenya(contrasenya) {
        const encoder = new TextEncoder();
        const data = encoder.encode(contrasenya);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function comprobarContrasenya(contrasenya, usuario) {
        var referencia = doc(db, "usuarios", usuario);
        var usuarioBaseDatos = await getDoc(referencia);
        var datos = usuarioBaseDatos.data();
        var contrasenyaHasheada = await hashearContrasenya(contrasenya);
        return {
            contrasenyaCorrecta: contrasenyaHasheada == datos.contrasenya,
            usuario: datos.usuario
        };
    }
});