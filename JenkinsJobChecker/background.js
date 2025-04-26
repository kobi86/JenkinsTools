// Poll every 1 minute
chrome.alarms.create("pollJobs", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== "pollJobs") return;
  
  // Get stored Jenkins URL, user identity, and timeFrame from storage
  chrome.storage.sync.get(["jenkinsUrl", "jenkinsUser", "timeFrame"], function(data) {
    const jenkinsUrl = data.jenkinsUrl;
    const jenkinsUser = data.jenkinsUser;
    const hours = parseInt(data.timeFrame) || 1;
    if (!jenkinsUrl || !jenkinsUser) {
      chrome.action.setBadgeText({ text: "" });
      return;
    }
    const currentTime = Date.now();
    const userThreshold = currentTime - (hours * 60 * 60 * 1000);
    
    // Retrieve the last time the badge was cleared (set by the popup)
    chrome.storage.local.get("lastBadgeClearTime", function(storageData) {
      const lastClear = storageData.lastBadgeClearTime || 0;
      // Use the later of the user-set threshold or the last clear time
      const effectiveThreshold = Math.max(userThreshold, lastClear);
      
      const treeParam = "jobs[name,url,builds[number,url,building,result,timestamp,actions[causes[userId,userName]]]]";
      const encodedTreeParam = encodeURIComponent(treeParam);
      const apiUrl = `${jenkinsUrl}/api/json?tree=${encodedTreeParam}`;
      
      fetch(apiUrl, { credentials: 'include' })
        .then(response => {
          if (!response.ok) throw new Error(`API error: ${response.status}`);
          return response.json();
        })
        .then(apiData => {
          let finishedJobs = [];
          (apiData.jobs || []).forEach(job => {
            (job.builds || []).forEach(build => {
              if (build.timestamp >= effectiveThreshold) {
                (build.actions || []).forEach(action => {
                  (action.causes || []).forEach(cause => {
                    if (cause.userId === jenkinsUser) {
                      if (!build.building && ["SUCCESS", "FAILED", "UNSTABLE"].includes(build.result)) {
                        finishedJobs.push({
                          jobName: job.name,
                          jobLink: build.url,
                          status: build.result,
                          buildNumber: build.number
                        });
                      }
                    }
                  });
                });
              }
            });
          });
          
          // Update the badge with the count of new finished jobs
          if (finishedJobs.length > 0) {
            chrome.action.setBadgeText({ text: finishedJobs.length.toString() });
            chrome.action.setBadgeBackgroundColor({ color: "#4688F1" });
          } else {
            chrome.action.setBadgeText({ text: "" });
          }
        })
        .catch(error => {
          console.error("Polling error: ", error);
        });
    });
  });
});
