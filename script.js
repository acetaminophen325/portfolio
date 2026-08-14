document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const navbar = document.querySelector('.navbar');
  const body = document.body;

  toggle.addEventListener('click', () => {
    navbar.classList.toggle('active');
    body.classList.toggle('active-sidebar');
  });
});
