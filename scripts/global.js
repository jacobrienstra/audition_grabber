// American Timezones BWWorld is likely to use
var tzAbbrs = {
  EDT: "America/New_York",
  EST: "America/New_York",
  CDT: "America/Chicago",
  CST: "America/Chicago",
  MDT: "America/Denver",
  MST: "America/Phoenix", // honestly, arizona?
  PDT: "America/Los_Angeles",
  PST: "America/Los_Angeles",
};

const dateRegex = /\b(?:(?:Mon)|(?:Tues?)|(?:Wed(?:nes)?)|(?:Thur?s?)|(?:Fri)|(?:Sat(?:ur)?)|(?:Sun))(?:day)?\b[:\-,]?\s*(?:(?:jan|feb)?r?(?:uary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|oct(?:ober)?|(?:sept?|nov|dec)(?:ember)?)\s+\d{1,2}\s*,?\s*\d{4}/i;
// not using but hell if I'm gonna get rid of this thing
const timeRegex = /^(?:((?:1[0-2]|0?[1-9])(?::(?:[0-5][0-9]))?(?:\s*)(?:[ap]m)?(?:(?:\s*(?:-?|(?:to)?)\s*)?(?:1[0-2]|0?[1-9])(?::(?:[0-5][0-9]))?(?:\s*)(?:[ap]m)?)?)(?:\s*)(\([a-z]{3}\)))\s*([\d\w]+\s*.*)?/i;
const shortDateRegex = /^.*(((?:(?:Mon)|(?:Tues?)|(?:Wed(?:nes)?)|(?:Thur?s?)|(?:Fri)|(?:Sat(?:ur)?)|(?:Sun))(?:day)?)\s+(\d{1,2}[/\-]\d{1,2})).*/i;

const toastDiv = document.createElement("div");
toastDiv.id = "toast";
const wrapperDiv = document.createElement("div");
wrapperDiv.classList.add("wrapper");
const descDiv = document.createElement("div");
descDiv.id = "desc";
const reportDiv = document.createElement("div");
reportDiv.id = "report";
wrapperDiv.appendChild(descDiv);
wrapperDiv.appendChild(reportDiv);
toastDiv.appendChild(wrapperDiv);

document.body.appendChild(toastDiv);

const launchToast = function(e = "Error. Sorry.", report = true, url = "") {
  descDiv.textContent = e;
  if (report) {
    reportDiv.innerHTML =
      "Is this a fuck up? <a href='" +
      url +
      "' target='_blank'>Tell me!</a> I'll try to fix it!";
  }
  toastDiv.className = "";
  void toastDiv.offsetWidth;
  toastDiv.className = "show";
};

// Recursively check current node and all children
// TODO: accept lists of node types
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

const escapeCommas = function(string) {
  return string.replace(/[,\/]/g, "\\,");
};

const camelize = (text, separator = " ") => {
  const words = text.split(separator);
  const result = [];
  words.forEach(word =>
    result.push(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  );
  return result.join("");
};

const foldLine = function(line) {
  const parts = [];
  while (line.length > 50) {
    parts.push(line.slice(0, 50));
    line = line.slice(50);
  }
  parts.push(line);
  return parts.join("\r\n ");
};

const getShortDate = function(line) {
  const matches = line.match(shortDateRegex);
  var ret = null;
  // w day
  var momDay = moment(matches[1], ["ddd M/D", "dddd M/D"], true);
  var mom = moment(matches[3], "M/D", true);
  var today = moment();
  var nextYear = today.add(1, "years").format("YYYY");

  // no weekday
  if (matches[2] === undefined && mom.isValid()) {
    // if today < target + 7, we'll say it's this year
    // give a week of leeway, should be plenty
    if (parseInt(moment().format("DDD")) <= parseInt(mom.format("DDD")) + 7) {
      ret = mom.format("DDD");
    } else {
      ret = moment(matches[a3] + " " + nextYear, "M/D YYYY", true).format(
        "DDD"
      );
    }
  } else {
    if (momDay.isValid()) {
      ret = momDay.format("DDD");
    } else {
      // maybe it's next year?
      var nextYearDate = matches[1] + " " + nextYear;
      var nextMom = moment(
        nextYearDate,
        ["ddd M/D YYYY", "dddd M/D YYYY"],
        true
      );
      if (nextMom.isValid()) {
        ret = nextMom.format("DDD");
      }
    }
  }
  return ret;
};

// Get all the sibling tags until some tag, filtering out filter
// TODO: list of node types, map of filter to times
// Returns list of siblings
const nextUntil = function(node, until, filter, untilIter = 1) {
  var siblings = [];
  while ((node = node.nextSibling) && node.nodeType !== 9) {
    // You can't skip text nodes
    if (node.nodeType === 3) {
      // No empty text nodes
      if (!/^[\s\n]*$/.test(node.textContent) && node.textContent !== "") {
        siblings.push(node);
      }
    }
    if (node.nodeType === 1) {
      if (until) {
        let curNode = node;
        let mCount = 0;
        for (let i = 0; i < untilIter; i++) {
          if (nodeOrChildrenMatches(node, until)) {
            mCount++;
          }
          curNode = curNode.nextSibling;
        }
        if (mCount === untilIter) {
          break;
        }
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
