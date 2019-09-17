chrome.storage.sync.get(function(settings) {
  document.querySelector(
    "input[name=cal][value=" + settings.calendar + "]"
  ).checked = true;
  var sectionCheckBoxes = document.querySelectorAll("input[name=section]");
  for (e of sectionCheckBoxes) {
    if (settings.sections.includes(e.value)) e.checked = true;
  }
});

button = document.getElementById("save");
button.addEventListener("click", function() {
  var cal = document.querySelector("input[name=cal]:checked").value;
  var sectionCheckBoxes = document.querySelectorAll(
    "input[name=section]:checked"
  );
  var sections = [];
  for (e of sectionCheckBoxes) {
    sections.push(e.value);
  }
  var toast = document.getElementById("toast");
  chrome.storage.sync.set({ sections: sections, calendar: cal }, function() {
    // -> removing the class
    toast.classList.remove("show");
    // -> triggering reflow /* The actual magic */
    // without this it wouldn't work. Try uncommenting the line and the transition won't be retriggered.
    // Oops! This won't work in strict mode. Thanks Felis Phasma!
    // element.offsetWidth = element.offsetWidth;
    // Do this instead:
    void toast.offsetWidth;
    // -> and re-adding the class
    toast.classList.add("show");
  });
});
