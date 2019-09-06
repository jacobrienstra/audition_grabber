const rule1 = {
  conditions: [
    new chrome.declarativeContent.PageStateMatcher({
      pageUrl: {
        hostContains: "broadwayworld",
        pathContains: "equity-audition"
      }
    })
  ],
  actions: [new chrome.declarativeContent.ShowPageAction()]
};

chrome.runtime.onInstalled.addListener(function(details) {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([rule1]);
  });
});

// Called when the user clicks on the browser action.
chrome.pageAction.onClicked.addListener(function(tab) {
  // No tabs or host permissions needed!
  chrome.tabs.executeScript({ file: "scripts/ics.deps.min.js" }, function() {
    chrome.tabs.executeScript({ file: "scripts/grabber.js" });
  });
});
