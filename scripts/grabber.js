// ES6
// Get all the sibling tags until some tag, filtering out filter
var nextUntil = function(node, until, filter) {
  var siblings = [];
  while ((node = node.nextSibling) && node.nodeType !== 9) {
    // You can't skip text nodes
    if (node.nodeType === 3) {
      // No empty text nodes
      if (!/^\s*\n*$/.test(node.textContent)) siblings.push(node);
    }
    if (node.nodeType === 1) {
      if (until && node.matches(until)) {
        break;
      }
      if (filter && node.matches(filter)) {
        continue;
      }
      siblings.push(node);
    }
  }
  return siblings;
};
chrome.storage.sync.get(function(settings) {
  var sections = settings.sections;
  var headers = document.getElementsByTagName("strong");
  var dateRegex = /\b(?:(?:Mon)|(?:Tues?)|(?:Wed(?:nes)?)|(?:Thur?s?)|(?:Fri)|(?:Sat(?:ur)?)|(?:Sun))(?:day)?\b[:\-,]?\s*(?:(?:jan|feb)?r?(?:uary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|oct(?:ober)?|(?:sept?|nov|dec)(?:ember)?)\s+\d{1,2}\s*,?\s*\d{4}/i;
  var timeRegex = /^(?:((?:1[0-2]|0?[1-9])(?::(?:[0-5][0-9]))?(?:\s*)(?:[ap]m)?(?:\s*(?:-?|(?:to)?)\s*)?(?:1[0-2]|0?[1-9])(?::(?:[0-5][0-9]))?(?:\s*)(?:[ap]m)?)(?:\s*)(\([a-z]{3}\)))/i;
  var date = (start_time = end_time = null);
  var subject = (loc = desc = "");

  // Assume the title is in the first <strong> tag
  var title = headers[0];
  subject += title.textContent.trim() + " "; // bold text
  subject += nextUntil(title, "strong", "br")
    .map(node => node.textContent.trim())
    .join(" ");
  for (let header of headers) {
    switch (header.textContent) {
      case "AUDITION DATE":
        data = nextUntil(header, "strong", "br");
        dates = [];
        other = [];
        let curDate = "";
        // iterate through date data
        for (let line of data) {
          line = line.textContent.trim();
          // if date, reset curDate str to it
          if (dateRegex.test(line)) {
            curDate = line.trim();
            continue;
          }
          // if time & we have date, add start & end
          if (timeRegex.test(line) && curDate !== "") {
            var matches = line.match(timeRegex);
            var [start, end] = matches[1].split("-").map(e => e.trim());
            var tz = "";
            if (matches.length == 3) {
              tz = matches[2];
            }
            dates.push({
              start: [curDate, start, tz].join(" "),
              end: [curDate, end, tz].join(" ")
            });
            continue;
          } else {
            // probably lunch info but who knows
            other.push(line.trim());
          }
        }
        dates = dates.map(function(dateDict) {
          return {
            start: new Date(dateDict.start),
            end: new Date(dateDict.end)
          };
        });
        desc += other.join("\n\n");
        break;
      case "LOCATION":
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
    desc = desc.replace("\n", "\\n");
    for (date of dates) {
      cal.addEvent(subject, desc, escapeCommas(loc), date.start, date.end, url);
    }

    var filename = camelize(subject.replace(/[^a-z\s]/gi, "")).slice(0, 25);
    // cal.download(filename);
  }

  if (settings.calendar == "google") {
    var links = [];
    for (date of dates) {
      var gCalLink =
        "https://calendar.google.com/calendar/r/eventedit?trp=False&sf=true&text=" +
        encodeURIComponent(subject) +
        "&dates=" +
        date.start
          .toISOString()
          .replace(/[\-:\.]/g, "")
          .replace("000Z", "Z") +
        "/" +
        date.end
          .toISOString()
          .replace(/[\-:\.]/g, "")
          .replace("000Z", "Z") +
        "&ctz=" +
        date.start
          .toLocaleTimeString("en-us", { timeZoneName: "short" })
          .split(" ")[2] +
        "&details=" +
        encodeURIComponent(desc + "\n\n" + url) +
        "&location=" +
        encodeURI(loc);
      links.push(gCalLink);
    }
    for (link of links) {
      console.log(link);
    }
  }
});
