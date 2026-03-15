(function () {
   const links = document.querySelectorAll(".nav__link");
   const pages = document.querySelectorAll(".page");

   function showPage(pageId) {
      pages.forEach((p) => {
         const isActive = p.id === pageId;
         p.classList.toggle("hidden", !isActive);
         p.setAttribute("aria-hidden", String(!isActive));
      });

      links.forEach((a) => {
         a.classList.toggle("active", a.dataset.page === pageId);
      });
   }

   links.forEach((a) => {
      a.addEventListener("click", (e) => {
         e.preventDefault();
         const pageId = a.dataset.page;
         history.replaceState(null, "", "#" + pageId);
         showPage(pageId);
      });
   });

   const initial = (location.hash || "#inicio").replace("#", "");
   showPage(initial);

})();

(function () {
const links = document.querySelectorAll(".nav__link");
const pages = document.querySelectorAll(".page");

function showPage(pageId) {
pages.forEach((p) => {
const isActive = p.id === pageId;
p.classList.toggle("hidden", !isActive);
p.setAttribute("aria-hidden", String(!isActive));
});

links.forEach((a) => {
a.classList.toggle("active", a.dataset.page === pageId);
});
}

links.forEach((a) => {
a.addEventListener("click", (e) => {
e.preventDefault();
const pageId = a.dataset.page;
history.replaceState(null, "", "#" + pageId);
showPage(pageId);
});
});

const initial = (location.hash || "#inicio").replace("#", "");
showPage(initial);

})();


// VALIDACIÓN DE FORMULARIO
const form = document.querySelector("#formularioCita");

if(form){

form.addEventListener("submit", function(e){

e.preventDefault();

let nombre = document.querySelector("#nombre").value.trim();
let correo = document.querySelector("#correo").value.trim();
let fecha = document.querySelector("#fecha").value;

if(nombre === "" || correo === "" || fecha === ""){
alert("Todos los campos son obligatorios");
return;
}

if(!correo.includes("@")){
alert("Correo electrónico inválido");
return;
}

const cita = {
nombre,
correo,
fecha
};

localStorage.setItem("citaPaciente", JSON.stringify(cita));

alert("Cita guardada correctamente");

});

}
