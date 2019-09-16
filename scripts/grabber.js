// ES6
// American Timezones BWWorld is likely to use
var tzAbbrs = {
  EDT: "America/New_York",
  CDT: "America/Chicago",
  MDT: "America/Denver",
  MST: "America/Phoenix", // honestly, arizona?
  PDT: "America/Los_Angeles"
};

function addStyleString(str) {
  var node = document.createElement("style");
  node.innerHTML = str;
  document.body.appendChild(node);
}

var toastStyle =
  "#toast {visibility: hidden;background-color: #333;color: #fff;text-align: center;border-radius: 2px;position: fixed;z-index: 1;right: 40px;top:60px;font-size: 17px;white-space: nowrap;}#toast #desc{color: #fff;padding: 24px;overflow: hidden;white-space:nowrap;}#toast.show {visibility: visible;-webkit-animation: fadein 0.5s,stay 3s 1s, fadeout 0.5s 2.5s;animation: fadein 0.5s, stay 3s 1s, fadeout 0.5s 4.5s;}@-webkit-keyframes fadein {from {top: -30px; opacity: 0;}to {top: 60px; opacity: 1;}}@keyframes fadein {from {top: -30px; opacity: 0;}to {top: 60px; opacity: 1;}}@-webkit-keyframes fadeout {from {top: 60px; opacity: 1;}to {top: -30px; opacity: 0;}}@keyframes fadeout {from {top: 60px; opacity: 1;}to {top: -30px; opacity: 0;}}";

addStyleString(toastStyle);
var toastDiv = document.createElement("div");
toastDiv.id = "toast";
var descDiv = document.createElement("div");
descDiv.id = "desc";
descDiv.innerHTML = "Something fucked up. Sorry.";
toastDiv.appendChild(descDiv);
document.body.appendChild(toastDiv);

function launch_toast() {
  var x = document.getElementById("toast");
  x.className = "show";
  setTimeout(function() {
    x.className = x.className.replace("show", "");
  }, 5000);
}

// Recursively check current node and all children
var nodeOrChildrenMatches = function(node, match) {
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
var nextUntil = function(node, until, filter) {
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
chrome.storage.sync.get(function(settings) {
  try {
    var sections = settings.sections;
    var headers = document.getElementsByTagName("strong");
    var dateRegex = /\b(?:(?:Mon)|(?:Tues?)|(?:Wed(?:nes)?)|(?:Thur?s?)|(?:Fri)|(?:Sat(?:ur)?)|(?:Sun))(?:day)?\b[:\-,]?\s*(?:(?:jan|feb)?r?(?:uary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|oct(?:ober)?|(?:sept?|nov|dec)(?:ember)?)\s+\d{1,2}\s*,?\s*\d{4}/i;
    var timeRegex = /^(?:((?:1[0-2]|0?[1-9])(?::(?:[0-5][0-9]))?(?:\s*)(?:[ap]m)?(?:(?:\s*(?:-?|(?:to)?)\s*)?(?:1[0-2]|0?[1-9])(?::(?:[0-5][0-9]))?(?:\s*)(?:[ap]m)?)?)(?:\s*)(\([a-z]{3}\)))/i;
    var date = (start_time = end_time = null);
    var subject = (loc = desc = "");
    var dates = [];
    var other = [];

    // Assume the title is in the first <strong> tag (I KNOW i hate this too)
    var title = headers[0];
    subject += title.textContent.trim() + " "; // bold text
    subject += nextUntil(title, "strong", "br")
      .map(node => node.textContent.trim())
      .join(" ");
    for (let header of headers) {
      switch (header.textContent) {
        case "AUDITION DATE":
        case "AUDITION DATES":
          data = nextUntil(header, "strong", "br");
          let curDate = "";
          // iterate through date data
          for (let line of data) {
            line = line.textContent.trim();
            // if date, reset curDate str to it
            if (moment(line, "ddd, MMM D, YYYY").isValid()) {
              curDate = line;
              continue;
            }
            // if time & we have date, add start & end
            if (timeRegex.test(line) && curDate !== "") {
              let matches = line.match(timeRegex);
              let [start, end] = matches[1].split("-").map(e => e.trim());
              let tz = "";
              if (matches.length == 3) {
                tz = matches[2].replace(/[()]/g, "");
              }
              if (end === undefined) {
                end = start;
              }
              if (tzAbbrs[tz] != null) {
                tz = tzAbbrs[tz];
              } else {
                tz = "";
              }
              dates.push({
                start: [curDate, start].join(" "),
                end: [curDate, end].join(" "),
                tz: tz
              });
              continue;
            } else {
              // probably lunch info but who knows
              other.push(line.trim());
            }
          }
          dates = dates.map(function(dateDict) {
            let start = moment.tz(
              dateDict.start,
              "ddd, MMM D, YYYY h:mma",
              dateDict.tz
            );
            let end = moment.tz(
              dateDict.end,
              "ddd, MMM D, YYYY h:mma",
              dateDict.tz
            );
            if (end.format() == start.format()) {
              // if there's no end time (???? why), set it as an hour later
              // and add a big note in the description
              end.add(1, "hours");
              desc =
                "***NO END TIME PROVIDED. FIGURE IT OUT I GUESS.***\n\n" + desc;
            }
            return {
              start: start,
              end: end
            };
          });
          desc += other.join("\n\n");
          break;
        case "LOCATION":
        case "LOCATIONS":
          loc = nextUntil(header, "strong", "br")
            .map(node => node.textContent.trim())
            .join(" ");
          break;
        default:
          if (!sections.includes(header.textContent)) break;
          if (desc != "") desc += "\n\n";
          desc +=
            header.textContent +
            "\n" +
            nextUntil(header, "strong", "br")
              .map(node => node.textContent.trim())
              .join(" ");
          break;
      }
    }

    var escapeCommas = function(string) {
      return string.replace(/[,\/]/g, "\\,");
    };

    var camelize = (text, separator = " ") => {
      const words = text.split(separator);
      const result = [];
      words.forEach(word =>
        result.push(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      );
      return result.join("");
    };

    function foldLine(line) {
      const parts = [];
      while (line.length > 50) {
        parts.push(line.slice(0, 50));
        line = line.slice(50);
      }
      parts.push(line);
      return parts.join("\r\n ");
    }

    var url = window.location.href;

    if (settings.calendar == "apple") {
      var cal = ics();
      desc = desc.replace(/\n/g, "\\n");
      for (date of dates) {
        cal.addEvent(
          subject,
          desc,
          escapeCommas(loc),
          date.start,
          date.end,
          url
        );
      }

      var filename =
        camelize(subject.replace(/[^a-z\s]/gi, "")).slice(0, 20) +
        moment().valueOf();
      cal.download(filename);
    }

    if (settings.calendar == "google") {
      var links = [];
      for (date of dates) {
        var gCalLink =
          "https://calendar.google.com/calendar/r/eventedit?trp=False&sf=true&text=" +
          encodeURIComponent(subject) +
          "&ctz=" +
          date.start.tz() +
          "&dates=" +
          date.start.utc().format("YYYYMMDD[T]HHmmss[Z]") +
          "/" +
          date.end.utc().format("YYYYMMDD[T]HHmmss[Z]") +
          "&details=" +
          encodeURIComponent(desc + "\n\n" + url) +
          "&location=" +
          encodeURI(loc);
        links.push(gCalLink);
      }
      for (link of links) {
        window.open(link, "_blank");
      }
    }
  } catch (e) {
    console.log(e);
    launch_toast();
  }
});
