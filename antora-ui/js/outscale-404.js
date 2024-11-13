(function () {

    const n = Math.floor(Math.random() * 14) + 1
    const img = document.createElement("img")
    img.src = "/_/img/404/" + n + ".jpg"
    img.width = 450
    img.height = img.width
    const p = document.createElement("p")
    p.classList.add("paragraph", "img404")
    p.append(img)
    document.querySelector(".doc").append(p)
      
  })()
