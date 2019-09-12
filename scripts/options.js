button = document.getElementById("save");
button.addEventListener("click", function() {
  sectionsDiv = document.getElementById("sections");
  var cal = document.querySelector("input[name=cal]:checked").value;
  var sectionCheckBoxes = document.querySelectorAll(
    "input[name=section]:checked"
  );
  var sections = [];
  for (e of sectionCheckBoxes) {
    sections.push(e.value);
  }
  chrome.storage.sync.set({ sections: sections, calendar: cal }, function() {
    var s = document.getElementById("saved");
    s.className = "show";
    setTimeout(function() {
      s.className = s.className.replace("show", "");
    }, 3000);
  });
});
