// ES6

// Get settings
chrome.storage.sync.get(function (settings) {
  try {
    var sections = settings.sections;
    var headers = document.getElementsByTagName("strong");
    var dateRegex = /\b(?:(?:Mon)|(?:Tues?)|(?:Wed(?:nes)?)|(?:Thur?s?)|(?:Fri)|(?:Sat(?:ur)?)|(?:Sun))(?:day)?\b[:\-,]?\s*(?:(?:jan|feb)?r?(?:uary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|oct(?:ober)?|(?:sept?|nov|dec)(?:ember)?)\s+\d{1,2}\s*,?\s*\d{4}/i;
    var timeRegex = /^(?:((?:1[0-2]|0?[1-9])(?::(?:[0-5][0-9]))?(?:\s*)(?:[ap]m)?(?:(?:\s*(?:-?|(?:to)?)\s*)?(?:1[0-2]|0?[1-9])(?::(?:[0-5][0-9]))?(?:\s*)(?:[ap]m)?)?)(?:\s*)(\([a-z]{3}\)))([\d\w]*\s*.*)/i;
    var date = (start_time = end_time = null);
    var subject = (loc = desc = "");
    var dates = [];

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
          let curDate = '';
          // iterate through date data
          var extratext = '';
          for (let line of data) {
            line = line.textContent.trim();
            // if date, add extratext to last date, reset curDate str to new date
            if (moment(line, "ddd, MMM D, YYYY").isValid()) {
              extratext = '';
              curDate = line;
              continue;
            }
            // if time & we have date, add start & end
            if (timeRegex.test(line) && curDate !== "") {
              let matches = line.match(timeRegex);
              let [start, end] = matches[1].split("-").map(e => e.trim());
              let tz = '';
              if (matches.length >= 3) {
                tz = matches[2].replace(/[()]/g, "");
                if (matches.length === 4) extratext += (matches[3].trim() + '\n');
              }
              if (end === undefined) {
                end = start;
              }
              if (tzAbbrs[tz] != null) {
                tz = tzAbbrs[tz]; // look up tz database name
              } else {
                tz = ""; // otherwise, default local tz
              }
              dates.push({
                start: [curDate, start].join(" "),
                end: [curDate, end].join(" "),
                tz: tz,
                extratext: extratext,
              });
              continue;
            } else {
              // probably lunch info but who knows
              if (dates.length !== 0) dates[dates.length - 1]['extratext'] += (line + '\n');
            }
          }
          dates = dates.map(function (dateDict) {
            idesc = '';
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
              idesc +=
                "***NO END TIME PROVIDED. FIGURE IT OUT I GUESS.***\n\n";
            }
            return {
              start: start,
              end: end,
              idesc: idesc + dateDict.extratext,
            };
          });
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

    var url = window.location.href;

    if (settings.calendar == "apple") {
      if (dates.length === 0) {
        throw "No events found on this page ¯\\_(ツ)_/¯";
      }
      var cal = ics();
      for (date of dates) {
        cal.addEvent(
          subject,
          (date.idesc + "\n\n" + desc).replace(/\n/g, "\\n"),
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
    launchToast(e);
  }
});