//= require ../lib/_lunr
//= require ../lib/_jquery
//= require ../lib/_jquery.highlight
;(function () {
  'use strict';

  var content, searchResults;
  var highlightOpts = { element: 'span', className: 'search-highlight' };
  var searchDelay = 0;
  var timeoutHandle = 0;

  var index = new lunr.Index();

  index.ref('id');
  index.field('title', { boost: 10 });
  index.field('body');
  index.pipeline.add(lunr.trimmer, lunr.stopWordFilter);

  $(populate);
  $(bind);

  function populate() {
    $('h2').each(function() {
      var title = $(this);
      var body = title.nextUntil('h1, h2');
      index.add({
        id: title.prop('id'),
        title: title.text(),
        body: body.text()
      });
    });

    determineSearchDelay();
  }
  function determineSearchDelay() {
    if(index.tokenStore.length>5000) {
      searchDelay = 300;
    }
  }

  function bind() {
    content = $('.api');
    searchResults = $('.search-results');

    $('#input-search').on('keyup',function(e) {
      var wait = function() {
        return function(executingFunction, waitTime){
          clearTimeout(timeoutHandle);
          timeoutHandle = setTimeout(executingFunction, waitTime);
        };
      }();
      wait(function(){
        search(e);
      }, searchDelay);
    });
  }

  function search(event) {

    var searchInput = $('#input-search')[0];

    if (!document.getElementById('input-search-close')) {
      var closeButton = document.createElement('span');
      closeButton.id = 'input-search-close';
      searchInput.parentNode.appendChild(closeButton);
      // Close button clears the field
      $('#input-search-close').on('click',function(e) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('keyup', {"keyCode": 27}));
        closeButton.remove();
      });
    }

    unhighlight();
    searchResults.addClass('visible');

    // ESC clears the field
    if (event.keyCode === 27) searchInput.value = '';

    if (searchInput.value) {
      var results = index.search(searchInput.value).filter(function(r) {
        return r.score > 0.0001;
      });

      if (results.length) {
        searchResults.empty();
        var resultsOperations = results.filter(
          result => (
            !result.ref.startsWith('tocs') && (
              result.ref.toLowerCase().endsWith(searchInput.value.toLowerCase()) ||
              result.ref.toLowerCase().endsWith(searchInput.value.toLowerCase() + 's')
            )
          )
        ).sort((a, b) => a.ref > b.ref);
        var resultsOtherOperations = results.filter(
          result => (
            !result.ref.startsWith('tocs') && (
              !result.ref.toLowerCase().endsWith(searchInput.value.toLowerCase()) &&
              !result.ref.toLowerCase().endsWith(searchInput.value.toLowerCase() + 's')
            )
          )
        );
        var resultsSchemas = results.filter(
          result => result.ref.startsWith('tocs')
        );
        var results = resultsOperations.concat(resultsOtherOperations, resultsSchemas)
        $.each(results, function (index, result) {
          var elem = document.getElementById(result.ref);
          var text = $(elem).text().replace(" Deprecation", "");
          if (
            !result.ref.startsWith('tocs') && (
              result.ref.toLowerCase().endsWith(searchInput.value.toLowerCase()) ||
              result.ref.toLowerCase().endsWith(searchInput.value.toLowerCase() + 's')
            )
          ) {
            searchResults.append("<li><a href='#" + result.ref + "' class='main-result'>" + text + "</a></li>");
          }
          else if (!result.ref.startsWith('tocs')) {
            searchResults.append("<li><a href='#" + result.ref + "' class='other-result'>" + text + "</a></li>");
          }
          else if (result.ref.startsWith('tocs')) {
            searchResults.append("<li><a href='#" + result.ref + "' class='other-result'>(Schema) " + text + "</a></li>");
          }
        });
        highlight.call(searchInput);
      } else {
        searchResults.html('<li><span></span></li>');
        $('.search-results li span').text('No results found for "' + searchInput.value + '".');
      }
    } else {
      unhighlight();
      searchResults.removeClass('visible');
      document.getElementById('input-search-close').remove();
    }
  }

  function highlight() {
    if (this.value) content.highlight(this.value, highlightOpts);
  }

  function unhighlight() {
    content.unhighlight(highlightOpts);
  }
})();

