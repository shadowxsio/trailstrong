// Anti-clickjacking : l'app refuse d'être affichée dans le cadre d'un autre site
// (GitHub Pages ne permet pas l'en-tête frame-ancestors).
if (window.top !== window.self) {
  document.documentElement.style.display = 'none'
  try {
    window.top.location = window.self.location.href
  } catch (e) {}
}
// Thème sombre uniquement (thème commun de la suite Trail), appliqué avant le premier rendu.
document.documentElement.dataset.theme = 'dark'
