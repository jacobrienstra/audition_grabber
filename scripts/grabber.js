// ES6

// Get settings
chrome.storage.sync.get(function (settings) {
  try {
    var sections = settings.sections;
    var headers = document.getElementsByTagName("strong");
    var dates = [];
    var locations = {};
    var defaultLoc = null;
    var desc = "";

    // Assume the title is in the first <strong> tag (i KNOW i hate this too)
    var title = headers[0];
    // TODO: check parents
    var subject = title.textContent.trim() + " "; // bold text
    subject += nextUntil(title, "strong", "br")
      .map(node => node.textContent.trim())
      .join(" ");
    for (const [i, header] of [...headers].entries()) {
      let headerText = header.textContent.trim();
      // I hate this so much it's so dumb but I have SEEN this.
      // part of the word is in the strong tag and 
      // part isn't. why? who can say. certainly not BWayWorld!
      if (header.previousSibling && header.previousSibling.nodeType === 3 && header.nextSibling && header.nextSibling.nodeType === 3) {
        headerText = header.previousSibling.textContent.trim() + header.textContent.trim() + header.nextSibling.textContent.trim();
      }
      switch (headerText) {
        case "AUDITION DATE":
        case "AUDITION DATES":
          lines = nextUntil(header, "strong", "BR");
          // unaccounted for text init val
          let extraText = '';
          // check regex per line, collect extra
          for (let [l, line] of [...lines].entries()) {
            line = line.textContent.trim();
            // if date, add extraText and reset
            if (moment(line, "ddd, MMM D, YYYY").isValid()) {
              if (dates.length > 0) {
                dates[dates.length - 1].extraText += extraText;
                extraText = '';
              }
              curDate = line;
              // check for **
              if (/\*+/.test(line)) {
                excIn = dates.length; // current index
              }
              continue;
            }
            // if time & we have date (idk why we wouldn't), add start & end
            if (timeRegex.test(line) && curDate !== '') {
              let matches = line.match(timeRegex);
              let [start, end] = matches[1].split("-").map(e => e.trim());
              let tz = '';
              // timezone
              if (matches[2] != null) {
                tz = matches[2].replace(/[()]/g, "");
              }
              // anything else
              if (matches[3] != null) {
                extraText += (matches[3].trim());
              }
              // no end time
              if (end === undefined) {
                end = start;
              }
              // no timezone
              if (tzAbbrs[tz] != null) {
                tz = tzAbbrs[tz]; // look up tz database name
              } else {
                tz = ""; // otherwise, default local tz
              }
              dates.push({
                start: [curDate, start].join(" "),
                end: [curDate, end].join(" "),
                tz: tz,
                extraText: '',
              });
              continue;
            } else {
              // probably lunch info but who knows
              // if we have text, add break
              if (extraText != '') {
                extraText += '\n\n';
              }
              extraText += (line);
              if (l === lines.length - 1) {
                dates[dates.length - 1].extraText += extraText;
              }
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
              idesc: idesc + dateDict.extraText,
            };
          });
          break;
        case "LOCATION":
        case "LOCATIONS":
          // TODO: need error handling
          const locLines = nextUntil(header, "strong", "br");
          // check if any normal lines are date specific location header
          for (let [j, locLine] of [...locLines].entries()) {
            if (shortDateRegex.test(locLine.textContent.trim())) {
              defaultLoc = locLines.slice(0, j).join(" ");
              // generalize
              let locDate = getShortDate(locLine.textContent.trim());
              if (locDate != null) {
                locations[locDate] = nextUntil(locLine, "br", "br", 2).map(n => n.textContent.trim()).join(" ");
                // TODO: test this
              }
            }
          }
          // check if any subsequent sections are date specific location headers
          var k = i;
          var curHeader = header;
          while (k++ && (curHeader = headers[k]) && k < headers.length && shortDateRegex.test(curHeader.textContent.trim())) {
            locDate = getShortDate(curHeader.textContent.trim());
            locations[locDate] = nextUntil(curHeader, "strong", "br").map(n => n.textContent.trim()).join(" ");
          }
          if (defaultLoc === null) {
            defaultLoc = locLines.map(n => n.textContent.trim()).join(" ");
          }
          break;
        default:
          if (!sections.includes(headerText)) break;
          if (desc != "") desc += "\n\n";
          desc +=
            headerText +
            "\n" +
            nextUntil(header, "strong", "br")
            .map(node => node.textContent.trim())
            .join(" ");
          break;
      }
    }

    var url = window.location.href;

    for (date of dates) {
      var day = date.start.format("DDD");
      if (day in locations) {
        date.loc = locations[day];
      } else {
        date.loc = defaultLoc;
      }
    }

    if (settings.calendar == "apple") {
      if (dates.length === 0) {
        throw "Grabber doesn't think there are any events listed on this page. ¯\\_(ツ)_/¯";
      }
      var cal = ics();
      for (date of dates) {
        cal.addEvent(
          subject,
          (date.idesc + "\n\n" + desc).replace(/\n/g, "\\n"),
          escapeCommas(date.loc),
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
          encodeURIComponent(date.idesc + "\n\n" + desc + "\n\n" + url) +
          "&location=" +
          encodeURI(date.loc);
        links.push(gCalLink);
      }
      for (link of links) {
        window.open(link, "_blank");
      }
    }
  } catch (e) {
    var url = "https://github.com/jacobrienstra/audition_grabber/issues/new?title=" + encodeURIComponent(e).replace(/'/g, "%27") + "&body=" + encodeURIComponent(window.location.href);
    launchToast(e, true, url);
    console.log(e);
  }
});