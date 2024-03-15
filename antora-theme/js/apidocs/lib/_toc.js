$(function() {
  loadToc($('#toc'), '.toc-link', '.toc-list-h2, .toc-list-h3, .toc-list-h4, .toc-list-h5, .toc-list-h6', 10);
  setupLanguages($('#api-body').data('languages'));
  $('.api').imagesLoaded( function() {
    recacheHeights();
    refreshToc();
  });
});

// window.onpopstate = function() {
//   activateLanguage(getLanguageFromQueryString());
// };