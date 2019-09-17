// American Timezones BWWorld is likely to use
var tzAbbrs = {
  EDT: "America/New_York",
  CDT: "America/Chicago",
  MDT: "America/Denver",
  MST: "America/Phoenix", // honestly, arizona?
  PDT: "America/Los_Angeles"
};

var toastDiv = document.createElement("div");
toastDiv.id = "toast";
var descDiv = document.createElement("div");
descDiv.id = "desc";
descDiv.innerHTML = "Something fucked up. Sorry.";
toastDiv.appendChild(descDiv);

document.body.appendChild(toastDiv);

const launchToast = function() {
  var x = document.getElementById("toast");
  x.className = "show";
  setTimeout(function() {
    x.className = x.className.replace("show", "");
  }, 5000);
};

// Recursively check current node and all children
const nodeOrChildrenMatches = function(node, match) {
  if (node.matches(match)) return true;
  var doesMatch = false;
  if (node.hasChildNodes() && match) {
    for (let i = 0; i < node.childNodes.length; i++) {
      if (node.childNodes[i].nodeType === 1) {
        doesMatch |= nodeOrChildrenMatches(node.childNodes[i], match);
        if (doesMatch == true) return doesMatch;
      }
    }
  }
  return doesMatch;
};

// Get all the sibling tags until some tag, filtering out filter
const nextUntil = function(node, until, filter) {
  var siblings = [];
  while ((node = node.nextSibling) && node.nodeType !== 9) {
    // You can't skip text nodes
    if (node.nodeType === 3) {
      // No empty text nodes
      if (!/^\s*\n*$/.test(node.textContent) && node.textContent !== "") {
        siblings.push(node);
      }
    }
    if (node.nodeType === 1) {
      if (until && nodeOrChildrenMatches(node, until)) {
        break;
      }
      if (
        (filter && nodeOrChildrenMatches(node, filter)) ||
        nodeOrChildrenMatches(node, "script")
      ) {
        continue;
      }
      siblings.push(node);
    }
  }
  return siblings;
};
