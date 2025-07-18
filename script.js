// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-analytics.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    getDocs,
    serverTimestamp,
    updateDoc,
    onSnapshot,
    increment,
    arrayUnion,
    query,
    where,
    collection,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

$(function () {
    // TODO: Add SDKs for Firebase products that you want to use
    // https://firebase.google.com/docs/web/setup#available-libraries
    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
        apiKey: "AIzaSyACXm8_LRfsRwSOZwQ-RtkN6JrggEpd5K4",
        authDomain: "votaciones-online-fb685.firebaseapp.com",
        projectId: "votaciones-online-fb685",
        storageBucket: "votaciones-online-fb685.firebasestorage.app",
        messagingSenderId: "1007029717801",
        appId: "1:1007029717801:web:98852cad85300266aa4538",
        measurementId: "G-DYL7827YJF"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    const db = getFirestore(app);

    // =========================
    //APARTADO: Variables globales
    // =========================

    var votosTotales = 0;
    var opcionesVotar;
    var tema;
    var tiempoReal;

    // =========================
    //AQUI ACABA EL APARTADO: Variables globales
    // =========================

    // =========================
    //APARTADO: Comprobar usuario
    // =========================

    const usuario = sessionStorage.getItem("usuario");
    var codigo = sessionStorage.getItem("sala");
    if (usuario != null) {
        $(".nombreUsuario").text(usuario);
        if (codigo != null) {
            unirteSala(codigo);
        }
    }

    else {
        $("#pantallaInicio").hide();
        $("#pantallaError").show();
    }

    // =========================
    //AQUI ACABA EL APARTADO: Comprobar usuario
    // =========================

    // =========================
    //APARTADO: Cerrar Sesion
    // =========================

    $("#cerrarSesion").click(function () {
        sessionStorage.removeItem("usuario");
        window.location.href = "index.html";
    });

    // =========================
    //AQUI ACABA EL APARTADO: Cerrar Sesion
    // =========================

    // =========================
    //APARTADO: Crear tu votacion
    // =========================

    $("#añadirOpcion").click(function () {
        crearOpcion();
    });

    $("body").on("click", ".opcion button", function () {
        var opcionarInteractuar = $(this).attr("class");
        if ($("#Opciones div").length > 2) {
            eliminarOpcion(opcionarInteractuar);
        }

        else {
            $(".errorMensaje").text("Tienes que tener un minimo de 2 opciones");
            $("#mensajeParaError_2").show();
            setTimeout(function () {
                $("#mensajeParaError_2").css("transform", "translateY(-100px)");
                setTimeout(function () {
                    $("#mensajeParaError_2").hide();
                    $("#mensajeParaError_2").css("transform", "translateY(0px)");
                }, 1000);
            }, 5000);
        }
    });

    $("#crearVotacion").click(async function () {
        var camposCompletos = comprobarCamposCompletos();

        if (camposCompletos) {
            tema = $("#temaVotacion").val().toUpperCase();
            var opciones = [];
            for (var i = 0; i < $("#Opciones div").length; i++) {
                opciones.push($(`#Opcion-${i}`).val());
            }
            var finalizarEnXHoras = $("#finalizarAutomaticamente").val();
            codigo = await crearSala(tema, opciones, finalizarEnXHoras);
            sessionStorage.setItem("sala", codigo);
            $("#pantallaInicio, footer, header").hide();
            opcionesVotar = opciones;
            colocarOpciones(opcionesVotar);
            crearBarras(opcionesVotar);
            $(".tema").text(tema);
            $("#codigo").text(codigo);
            var quiereVotar = document.getElementById("quiereParticipar");
            var referencia = doc(db, "votacionesActivas", codigo);
            if (quiereVotar.checked) {
                $("#pantallaVotaciones").show();

                await updateDoc(referencia, {
                    personasVotado: arrayUnion(usuario)
                });
            }

            else {
                $("#pantallaVotar").show();
            }
            $("#informacionVotacionAbajo, #header_2").show();
            var documento = await getDoc(referencia);
            var datos = documento.data();
            console.log(datos.creador);
            console.log(datos.estadoVotacion);
            if (usuario == datos.creador && datos.estadoVotacion == "activa") {
                $("#FinalizarVotacion").show();
            }

            else {
                $("#FinalizarVotacion").hide();
            }

        }

        else {
            $(".errorMensaje").text("No puedes dejar ningun campo vacio");
            $("#mensajeParaError_2").show();
            setTimeout(function () {
                $("#mensajeParaError_2").css("transform", "translateY(-100px)");
                setTimeout(function () {
                    $("#mensajeParaError_2").hide();
                    $("#mensajeParaError_2").css("transform", "translateY(0px)");
                }, 1000);
            }, 5000);
        }
    });

    // =========================
    //AQUI ACABA EL APARTADO: Crear tu votacion
    // =========================

    // =========================
    //APARTADO: Unirte a una sala
    // =========================

    $("#buscar").click(async function () {
        if ($("#codigoBucar").val() != "") {
            var salaBuscar = String($("#codigoBucar").val());
            var informacionPartida = await comprobarPartidaExiste(salaBuscar);
            if (informacionPartida) {
                codigo = salaBuscar;
                sessionStorage.setItem("sala", codigo);
                unirteSala(codigo);
            }

            else {
                $(".errorMensaje").text("Lo sentimos, esta sala no existe");
                $("#mensajeParaError_2").show();
                setTimeout(function () {
                    $("#mensajeParaError_2").css("transform", "translateY(-100px)");
                    setTimeout(function () {
                        $("#mensajeParaError_2").hide();
                        $("#mensajeParaError_2").css("transform", "translateY(0px)");
                    }, 1000);
                }, 5000);
            }
        }

        else {
            $(".errorMensaje").text("Tiene que introducir el codigo de la sala");
            $("#mensajeParaError_2").show();
            setTimeout(function () {
                $("#mensajeParaError_2").css("transform", "translateY(-100px)");
                setTimeout(function () {
                    $("#mensajeParaError_2").hide();
                    $("#mensajeParaError_2").css("transform", "translateY(0px)");
                }, 1000);
            }, 5000);
        }

    });

    // =========================
    //AQUI ACABA EL APARTADO: Unirte a una sala
    // =========================

    // =========================
    //APARTADO: Votar
    // =========================

    $("body").on("click", "#opcionesParaVotar div button", async function () {
        $("#pantallaVotar").hide();
        $("#pantallaVotaciones").show();
        var referencia = doc(db, "votacionesActivas", codigo);
        var documento = await getDoc(referencia);
        var datos = documento.data();
        var usuarioExiste = await comprobarUsuarioExiste2(usuario.toLowerCase());

        if (datos.estadoVotacion == "activa" && !datos.personasVotado.includes(usuario) && usuarioExiste) {
            var votado = $(this).attr("class");

            await updateDoc(referencia, {
                [`opciones.${votado}`]: increment(1),
                personasVotado: arrayUnion(usuario),
                totalVotos: increment(1)
            });
        }

        else {
            $(".errorMensaje").text("Lo sentimos, la votacion ha finalizado o usted ya voto, si crees que es un error reportalo");
            $("#mensajeParaError").show();
            setTimeout(function () {
                $("#mensajeParaError").css("transform", "translateY(-100px)");
                setTimeout(function () {
                    $("#mensajeParaError").hide();
                    $("#mensajeParaError").css("transform", "translateY(0px)");
                }, 1000);
            }, 5000);
        }
    });

    // =========================
    //AQUI ACABA EL APARTADO: Votar
    // =========================

    // =========================
    //APARTADO: Acabar la votacion
    // =========================

    $("#FinalizarVotacion").click(async function () {
        var referencia = doc(db, "votacionesActivas", codigo);
        var documento = await getDoc(referencia);
        var datos = documento.data();
        $("#FinalizarVotacion").hide();
        if (usuario == datos.creador) {
            await updateDoc(referencia, {
                estadoVotacion: "finalizada"
            });
        }
    });

    // =========================
    //AQUI ACABA EL APARTADO: Acabar la votacion
    // =========================

    // =========================
    //APARTADO: Salir de la sala
    // =========================

    $("#salirSala").click(function () {
        tiempoReal();
        sessionStorage.removeItem("sala");
        $("#header_2, #pantallaVotar, #pantallaVotaciones, #informacionVotacionAbajo").hide();
        $("header, #pantallaInicio, footer").show();
    });

    // =========================
    //AQUI ACABA EL APARTADO: Salir de la sala
    // =========================

    // =========================
    //APARTADO: Cambiar tema
    // =========================

    $("#tema, #tema2").click(function () {
        var temaActual = $(this).attr("class");
        if (temaActual == "claro") {
            var temaCambiar = "oscuro";
        }

        else {
            var temaCambiar = "claro";
        }
        $(this).attr("src", `Images/${temaCambiar}.svg`);
        $(`.${temaActual}`).addClass(temaCambiar);
        $(`.${temaActual}`).removeClass(temaActual);
    });

    // =========================
    //AQUI ACABA EL APARTADO: Cambiar tema
    // =========================

    // =========================
    //APARTADO: Finalizar automaticamente la votacion
    // =========================



    // =========================
    //AQUI ACABA EL APARTADO: Finalizar automaticamente la votacion
    // =========================

    function crearOpcion() {
        var opcionAñadir = $("#Opciones div").length;
        $("#Opciones").append(`
            <div class="Opcion-${opcionAñadir} opcion">
                <input id="Opcion-${opcionAñadir}" type="text" placeholder="Opcion ${opcionAñadir + 1}">
                <button class="Opcion-${opcionAñadir}"><img src="Images/636163.png" alt=""></button>
            </div>
        `);
    }

    function eliminarOpcion(opcionElimiar) {
        var listaOpciones = [];
        $(`.${opcionElimiar}`).remove();
        for (var i = 0; i < $("#Opciones div").length; i++) {
            listaOpciones.push($(`#Opcion-${i}`).val());
        }
        var cantidadOpciones = $("#Opciones div").length;
        $(".opcion").remove();
        for (var i = 0; i < cantidadOpciones; i++) {
            $("#Opciones").append(`
                <div class="Opcion-${i} opcion">
                    <input id="Opcion-${i}" type="text" placeholder="Opcion ${i + 1}">
                    <button class="Opcion-${i}"><img src="Images/636163.png" alt=""></button>
                </div>
            `);
            $(`#Opcion-${i}`).val(listaOpciones[i]);
        }
    }

    function comprobarCamposCompletos() {
        if ($("#temaVotacion").val() == "") {
            return false;
        }

        for (var i = 0; i < $("#Opciones div").length; i++) {
            if ($(`#Opcion-${i}`).val() == "") {
                return false;
            }
        }

        return true;
    }

    async function crearSala(temaSala, opcionesSala, finalizarVotacion) {
        var codigoSala;
        var partidaExiste = true;

        while (partidaExiste) {
            codigoSala = numeroAleatorio(100000, 999999);
            codigoSala = String(codigoSala);
            partidaExiste = await comprobarPartidaExiste(codigoSala);
        }
        codigoSala = String(codigoSala);
        var opcionesJuego = {};

        opcionesSala.forEach((valor, index) => {
            opcionesJuego[`Opcion-${index}`] = 0;
        });

        var referencia = doc(db, "votacionesActivas", codigoSala);
        await setDoc(referencia, {
            tema: temaSala,
            opciones: opcionesJuego,
            opcionesParaVotar: opcionesSala,
            totalVotos: 0,
            estadoVotacion: "activa",
            creador: usuario,
            personasVotado: [],
            fechaCreacion: serverTimestamp()
        });
        var documento = await getDoc(referencia);
        var informacion = documento.data();
        var fechaCreacion = informacion.fechaCreacion.toDate();
        var fechaLimite = new Date(fechaCreacion);
        var borrarDocumento = new Date(fechaCreacion);
        borrarDocumento.setHours(borrarDocumento.getHours() + 24);
        fechaLimite.setHours(fechaLimite.getHours() + Number(finalizarVotacion));
        await updateDoc(referencia, {
            fechaEliminacion: borrarDocumento,
            finalizarVotacion: fechaLimite
        });
        var fechaActual = new Date();
        var salasVencidas = query(
            collection(db, "votacionesActivas"),
            where("fechaEliminacion", "<=", fechaActual)
        );
        var documentosBorrar = await getDocs(salasVencidas);
        documentosBorrar.forEach(async (documento) => {
            await deleteDoc(doc(db, "votacionesActivas", documento.id));
        });
        leerDatosTiempoReal(codigoSala);
        return codigoSala;
    }

    async function comprobarPartidaExiste(codigoComprobar) {
        var referencia = doc(db, "votacionesActivas", codigoComprobar);
        var documento = await getDoc(referencia);
        return documento.data();
    }

    function colocarOpciones(opcionesPoner) {
        $("#opcionesParaVotar div").remove();
        for (var i = 0; i < opcionesPoner.length; i++) {
            $("#opcionesParaVotar").append(`
                <div id="elecion-${i}" class="elecion">
                    <p>${opcionesPoner[i]}</p>
                    <button class = "Opcion-${i}"><span>VOTAR</span></button>
                </div>
            `);
        }
    }

    function crearBarras(opcionesPoner) {
        $("#barrasOpciones p, #barrasOpciones div").remove();
        for (var i = 0; i < opcionesPoner.length; i++) {
            $("#barrasOpciones").append(`
                <p class="OpcionVotacion">${opcionesPoner[i]}</p>
                <div class="cajaBarra">
                    <div class="barra" id="Opcio-${i}">
                        <span><span class="porcentaje">0</span>%</span>
                    </div>
                </div>
            `);
        }
    }

    function numeroAleatorio(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function leerDatosTiempoReal(codigoParaLeer) {
        var referencia = doc(db, "votacionesActivas", codigoParaLeer);
        tiempoReal = onSnapshot(referencia, (leerDatos) => {
            var datos = leerDatos.data();
            votosTotales = datos.totalVotos;
            var porcentajeAlto = 0;
            var opcionGanando;
            for (var i = 0; i < Object.keys(datos.opciones).length; i++) {
                var porcentaje = (datos.opciones[`Opcion-${i}`] / votosTotales) * 100;
                if (porcentajeAlto < porcentaje) {
                    porcentajeAlto = porcentaje;
                    opcionGanando = i;
                }
                $(`#Opcio-${i}`).css("width", `${porcentaje}%`);
                if (isNaN(porcentaje)) {
                    porcentaje = 0;
                }
                $(`#Opcio-${i} span span`).text(`${Math.floor(porcentaje)}`);
            }
            $(`.barra`).addClass("perdiendo");
            $(`#Opcio-${opcionGanando}`).removeClass("perdiendo");
            $(`#Opcio-${opcionGanando}`).addClass("ganando");
            $("#personasVotado").text(votosTotales);
            var fechaLimite = datos.finalizarVotacion.toDate();
            var fechaActual = new Date();
            if (fechaActual >= fechaLimite) {
                datos.estadoVotacion = "finalizada";
            }
            if (datos.estadoVotacion == "activa") {
                $("#estadoVotacion").attr("class", "activa");
                $("#estadoVotacion").text("🟢 ACTIVA...");
            }

            else if (datos.estadoVotacion == "finalizada") {
                $("#pantallaVotar").hide();
                $("#pantallaVotaciones").show();
                $("#estadoVotacion").attr("class", "finalizada");
                $("#estadoVotacion").text("🔴 FINALIZADA");
            }
        });
    }

    async function comprobarUsuarioExiste2(usuarioComprobar) {
        var referencia = doc(db, "usuarios", usuarioComprobar);
        var documento = await getDoc(referencia);
        return documento.exists();
    }

    async function unirteSala(codigoUnirte) {
        var informacionPartida = await comprobarPartidaExiste(codigo);
        if (informacionPartida) {
            $("#codigo").text(codigoUnirte);
            opcionesVotar = informacionPartida.opcionesParaVotar;
            tema = informacionPartida.tema;
            $(".tema").text(tema);
            $("#pantallaInicio, footer, header").hide();
            if (!informacionPartida.personasVotado.includes(usuario)) {
                $("#pantallaVotar").show();
            }

            else {
                $("#pantallaVotaciones").show();
            }
            $("#header_2, #informacionVotacionAbajo").show();
            if (usuario == informacionPartida.creador && informacionPartida.estadoVotacion != "activa") {
                $("#FinalizarVotacion").show();
            }

            else {
                $("#FinalizarVotacion").hide();
            }
            colocarOpciones(opcionesVotar);
            crearBarras(opcionesVotar);
            leerDatosTiempoReal(codigoUnirte);
        }
    }
});