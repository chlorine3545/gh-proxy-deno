document.forms[0].addEventListener('submit', function(e) {
    e.preventDefault();
    const url = new URL(window.location.href);
    url.pathname = this.querySelector('input').value;
    window.open(url.toString());
});

window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', ({ matches }) => {
        document.body.classList.toggle('dark-mode', matches);
    });