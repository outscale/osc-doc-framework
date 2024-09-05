;(function () {
  'use strict'

  const originalTitle = document.title
  const originalTitleSuffix = ' – ' + originalTitle.split(' – ')[1]

  var articleSelector = '.api'
  var article = document.querySelector(articleSelector)
  if (!article) return
  var headingsSelector = []
  for (var level = 0; level <= 1; level++) {
    var headingSelector = [articleSelector]
    headingSelector.push('h' + (level + 1) + '[id]')
    headingsSelector.push(headingSelector.join('>'))
  }
  var headings = find(headingsSelector.join(','), article.parentNode)

  const navContainer = document.querySelector(".nav-container")

  var lastActiveFragment
  var links = {}
  for (const heading of headings) {
    const link = document.querySelector('[href="#' + heading.id + '"]')
    links['#' + heading.id] = link
  }

  function onScroll () {
    var scrolledBy = window.pageYOffset
    var buffer = getNumericStyleVal(document.documentElement, 'fontSize') * 1.15 + 300
    var ceil = article.offsetTop
    if (scrolledBy && window.innerHeight + scrolledBy + 2 >= document.documentElement.scrollHeight) {
      lastActiveFragment = Array.isArray(lastActiveFragment) ? lastActiveFragment : Array(lastActiveFragment || 0)
      var activeFragments = []
      var lastIdx = headings.length - 1
      headings.forEach(function (heading, idx) {
        var fragment = '#' + heading.id
        if (idx === lastIdx || heading.getBoundingClientRect().top + getNumericStyleVal(heading, 'paddingTop') > ceil) {
          activeFragments.push(fragment)
          if (lastActiveFragment.indexOf(fragment) < 0) links[fragment].classList.add('is-active')
        } else if (~lastActiveFragment.indexOf(fragment)) {
          links[lastActiveFragment.shift()].classList.remove('is-active')
        }
      })
      lastActiveFragment = activeFragments.length > 1 ? activeFragments : activeFragments[0]
      return
    }
    if (Array.isArray(lastActiveFragment)) {
      lastActiveFragment.forEach(function (fragment) {
        links[fragment].classList.remove('is-active')
      })
      lastActiveFragment = undefined
    }
    var activeFragment
    headings.some(function (heading) {
      if (heading.getBoundingClientRect().top + getNumericStyleVal(heading, 'paddingTop') - buffer > ceil) return true
      activeFragment = '#' + heading.id
    })
    if (activeFragment) {
      if (activeFragment === lastActiveFragment) return
      if (lastActiveFragment) {
        links[lastActiveFragment].classList.remove('is-active')
        toggleNavLinks('remove', lastActiveFragment)
      }
      toggleNavLinks('add', activeFragment, lastActiveFragment)
      var activeLink = links[activeFragment]
      activeLink.classList.add('is-active')
      lastActiveFragment = activeFragment
    } else if (lastActiveFragment) {
      links[lastActiveFragment].classList.remove('is-active')
      lastActiveFragment = undefined
    }
  }

  function find (selector, from) {
    return [].slice.call((from || document).querySelectorAll(selector))
  }

  function getNumericStyleVal (el, prop) {
    return parseFloat(window.getComputedStyle(el)[prop])
  }

  function toggleNavLinks (verb, activeFragment, lastActiveFragment) {
    const iActive = headings.indexOf(
      headings.find((x) => activeFragment === '#' + x.id)
    )
    let i = iActive
    for (i; headings[i].tagName.slice(1) !== '1'; i--) {
    }
    const iTop = i
    links['#' + headings[i].id].classList[verb]('co-active')
    for (i = i + 1; headings[i] && headings[i].tagName.slice(1) !== '1'; i++) {
      links['#' + headings[i].id].classList[verb]('co-active')
    }
    // Scroll ToC
    if (verb === 'add') {
      const iLastActive = headings.indexOf(
        headings.find((x) => lastActiveFragment === '#' + x.id)
      )
      let iScrollTarget
      if (i < headings.length - 1 && i - iActive < 20 && i - iActive > -20) {
        if (iActive >= iLastActive) {
          iScrollTarget = i
        }
        else if (iActive < iLastActive && iTop > 0) {
          iScrollTarget = iTop - 1
        }
        else if (iActive < iLastActive && iTop <= 0) {
          iScrollTarget = iTop
        }
      }
      else if (iActive < headings.length) {
        if (iActive >= iLastActive && iActive + 1 < headings.length) {
          iScrollTarget = iActive + 1
        }
        else if (iActive >= iLastActive && iActive + 1 >= headings.length) {
          iScrollTarget = iActive
        }
        else if (iActive < iLastActive) {
          iScrollTarget = iActive - 1
        }
      }
      if (iScrollTarget > -1) {
        links['#' + headings[iScrollTarget].id].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        navContainer.scrollTo({top: 0})
      }
      if (iActive > 0) {
        window.history.replaceState(null, '', activeFragment)
        document.title = links[activeFragment].textContent + ' ' + originalTitleSuffix
      } else if (iScrollTarget === 0) {
        window.history.replaceState(null, '', window.location.pathname)
        document.title = originalTitle
      }
    }
  }

  onScroll()
  // let trigger
  // window.addEventListener('scroll', function() {
  //   if (!trigger) {
  //     trigger = true
  //     setTimeout(function () { 
  //       trigger = false
  //       onScroll()
  //     }, 300)
  //   }
  // })
  window.addEventListener('scroll', onScroll)
})()
