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
