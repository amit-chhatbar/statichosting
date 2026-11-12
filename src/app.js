// Front-end behaviour: mobile menu, footer year, appointment form validation.
// Note: this is a static site (S3), so the form has no backend yet; it only
// validates and confirms on the page.
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();

  const toggle = document.querySelector('.nav-toggle');
  const links = document.getElementById('nav-links');
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  const form = document.getElementById('appointment-form');
  const message = document.getElementById('form-message');
  form.date.min = new Date().toISOString().slice(0, 10);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      message.textContent = 'Please fill in all fields.';
      message.className = 'form-message error';
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    message.textContent = `Thank you, ${data.name}. We'll call you to confirm your ${data.department} appointment on ${data.date}.`;
    message.className = 'form-message success';
    form.reset();
  });
});
