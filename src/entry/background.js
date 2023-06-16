let infoRs = {}
chrome.identity.getProfileUserInfo({'accountStatus': 'ANY'}, function (info) {
  infoRs = info
});
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.type !== 'get-info') {
      return
    }
    sendResponse({...infoRs});
  }
);