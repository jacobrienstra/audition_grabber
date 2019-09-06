// ES6

var headers = document.getElementsByTagName("strong");

var date = (start_time = end_time = null);
var lunch = (subject = desc = seeking = prep = loc = "");

function getNextTextNode(node) {
  node = node.nextSibling;
  while (
    node !== null &&
    ((node.nodeType !== 3 && node.nodeName != "STRONG") ||
      (node.nodeType === 3 && !/\S/.test(node.nodeValue)))
  ) {
    node = node.nextSibling;
  }
  return node;
}

var title = headers[0];
subject += title.innerHTML.trim() + " ";
filename = title.innerHTML
  .replace(/\s/g, "")
  .toLowerCase()
  .trim();
title = getNextTextNode(title);
do {
  subject += title.wholeText.trim();
  subject += " ";
  title = getNextTextNode(title);
} while (title !== null && title.nodeName != "STRONG");

for (let header of headers) {
  switch (header.innerHTML) {
    case "AUDITION DATE":
      var node = getNextTextNode(header);
      date = node.wholeText.trim();
      node = getNextTextNode(node);
      var times = node.wholeText.trim();
      var [start, end] = times.split("-");
      start_time = new Date(date + " " + start);
      end_time = new Date(date + " " + end);
      lunch = getNextTextNode(node).wholeText.trim();
      break;
    case "LOCATION":
      var node = getNextTextNode(header);
      do {
        loc += node.wholeText.trim();
        loc += ", ";
        node = getNextTextNode(node);
      } while (node.nodeName != "STRONG");
      break;
    case "PREPARATION":
      var node = getNextTextNode(header);
      prep = node.wholeText.trim(); //while
      break;
    case "SEEKING":
      var node = getNextTextNode(header);
      seeking = node.wholeText.trim(); //while
      break;
    default:
      break;
  }
}
desc += "PREPARATION:\\n" + prep + "\\n\\nSEEKING:\\n" + seeking + "\\n\\n";

function escape(string) {
  return string.replace(/[,\/]/g, "\\,");
}

var cal = ics();
cal.addEvent(
  subject,
  desc,
  escape(loc),
  start_time,
  end_time,
  window.location.href
);
cal.download(filename);
