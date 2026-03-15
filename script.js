document.addEventListener("DOMContentLoaded", function(){

const formulario = document.querySelector("#formulario");
const mensaje = document.querySelector("#mensaje");

formulario.addEventListener("submit", function(e){

e.preventDefault();

let nombre = document.querySelector("#nombre").value.trim();
let correo = document.querySelector("#correo").value.trim();

if(nombre === "" || correo === ""){

mensaje.innerHTML = "Todos los campos son obligatorios";
mensaje.classList.add("error");

return;

}

if(!correo.includes("@")){

mensaje.innerHTML = "Correo electrónico inválido";
mensaje.classList.add("error");

return;

}

mensaje.innerHTML = "Formulario enviado correctamente";
mensaje.classList.remove("error");
mensaje.classList.add("exito");

let datos = {
nombre: nombre,
correo: correo
};

localStorage.setItem("usuario", JSON.stringify(datos));

});

});
