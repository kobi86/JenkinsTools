document.addEventListener('DOMContentLoaded', function() {
  // Clear the badge as soon as the popup loads.
  chrome.action.setBadgeText({ text: "" });
  // Record the time when the popup was opened.
  chrome.storage.local.set({ lastBadgeClearTime: Date.now() });

  const jenkinsUrlInput = document.getElementById('jenkinsUrl');
  const timeFrameSelect = document.getElementById('timeFrame');
  const sortOrderSelect = document.getElementById('sortOrder');
  const saveBtn = document.getElementById('saveBtn');
  const fetchBtn = document.getElementById('fetchBtn');
  const openFullPageBtn = document.getElementById('openFullPageBtn');
  const statusDiv = document.getElementById('status');
  const resultsPre = document.getElementById('results');

  // Override default <pre> styling.
  resultsPre.style.textAlign = 'left';
  resultsPre.style.whiteSpace = 'normal';

  // Function to fetch the user identity from /whoAmI/api/json.
  function fetchIdentity(jenkinsUrl) {
    fetch(`${jenkinsUrl}/whoAmI/api/json`, { credentials: 'include' })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch identity: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        const userName = data.name;
        if (!userName) {
          throw new Error('Name not found in whoAmI response');
        }
        chrome.storage.sync.set({ jenkinsUser: userName });
        statusDiv.textContent = 'Identity fetched successfully!';
        setTimeout(() => { statusDiv.textContent = ''; }, 3000);
      })
      .catch(error => {
        statusDiv.textContent = error.message;
      });
  }

  // Load saved settings (Jenkins URL, timeFrame, sortOrder) from storage.
  chrome.storage.sync.get(['jenkinsUrl', 'timeFrame', 'sortOrder'], function(data) {
    if (data.jenkinsUrl) {
      jenkinsUrlInput.value = data.jenkinsUrl;
      fetchIdentity(data.jenkinsUrl);
    }
    if (data.timeFrame) {
      timeFrameSelect.value = data.timeFrame;
    }
    if (data.sortOrder) {
      sortOrderSelect.value = data.sortOrder;
    }
  });

  // Auto-save the time frame when changed.
  timeFrameSelect.addEventListener('change', function() {
    chrome.storage.sync.set({ timeFrame: timeFrameSelect.value }, function() {
      statusDiv.textContent = 'Time frame saved!';
      setTimeout(() => { statusDiv.textContent = ''; }, 2000);
    });
  });

  // Auto-save the sort order when changed.
  sortOrderSelect.addEventListener('change', function() {
    chrome.storage.sync.set({ sortOrder: sortOrderSelect.value }, function() {
      statusDiv.textContent = 'Sort order saved!';
      setTimeout(() => { statusDiv.textContent = ''; }, 2000);
    });
  });

  // Save Jenkins URL and settings, then fetch identity.
  saveBtn.addEventListener('click', function() {
    const jenkinsUrl = jenkinsUrlInput.value.trim();
    const timeFrame = timeFrameSelect.value;
    const sortOrder = sortOrderSelect.value;
    if (!jenkinsUrl) {
      statusDiv.textContent = 'Please enter a Jenkins URL.';
      return;
    }
    chrome.storage.sync.set({ jenkinsUrl: jenkinsUrl, timeFrame: timeFrame, sortOrder: sortOrder }, function() {
      statusDiv.textContent = 'Settings saved!';
      setTimeout(() => { statusDiv.textContent = ''; }, 3000);
      chrome.storage.local.set({ lastBadgeClearTime: Date.now() });
      fetchIdentity(jenkinsUrl);
    });
  });

  // Open full page view.
  if (openFullPageBtn) {
    openFullPageBtn.addEventListener('click', function() {
      chrome.tabs.create({ url: chrome.runtime.getURL("fullpage.html") });
    });
  }

  // Manual fetch for job data.
  fetchBtn.addEventListener('click', function() {
    resultsPre.textContent = '';
    statusDiv.textContent = 'Fetching Jenkins data...';
    chrome.storage.sync.get(['jenkinsUrl', 'jenkinsUser', 'timeFrame', 'sortOrder'], function(storageData) {
      const jenkinsUrl = storageData.jenkinsUrl;
      const jenkinsUser = storageData.jenkinsUser;
      const hours = parseInt(storageData.timeFrame) || 1;
      const sortOrder = storageData.sortOrder || "asc";
      
      if (!jenkinsUrl) {
        statusDiv.textContent = 'Please enter a Jenkins URL and save settings.';
        return;
      }
      if (!jenkinsUser) {
        statusDiv.textContent = 'User identity not found. Please save settings to fetch identity.';
        return;
      }
      
      // Query Jenkins API including duration.
      const treeParam = "jobs[name,url,builds[number,url,building,result,timestamp,duration,actions[causes[userId,userName]]]]";
      const encodedTreeParam = encodeURIComponent(treeParam);
      const apiUrl = `${jenkinsUrl}/api/json?tree=${encodedTreeParam}`;
      
      fetch(apiUrl, { credentials: 'include' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to retrieve jobs: ${response.status}`);
          }
          return response.json();
        })
        .then(apiData => {
          const currentTime = Date.now();
          const threshold = currentTime - (hours * 60 * 60 * 1000);
          let filteredBuilds = [];
          (apiData.jobs || []).forEach(job => {
            (job.builds || []).forEach(build => {
              // Compute finish time using duration if available; otherwise, use start time.
              const finishTime = (build.duration && build.duration > 0) ? (build.timestamp + build.duration) : build.timestamp;
              if (finishTime >= threshold) {
                (build.actions || []).forEach(action => {
                  (action.causes || []).forEach(cause => {
                    if (cause.userId === jenkinsUser) {
                      // Include in-progress jobs and finished jobs.
                      if (build.building) {
                        filteredBuilds.push({
                          jobName: job.name,
                          jobLink: build.url,
                          status: "IN-PROGRESS",
                          startTime: build.timestamp
                        });
                      } else if (build.result) {
                        filteredBuilds.push({
                          jobName: job.name,
                          jobLink: build.url,
                          status: build.result,
                          startTime: build.timestamp,
                          finishTime: finishTime
                        });
                      }
                    }
                  });
                });
              }
            });
          });
          
          // Sort filteredBuilds based on startTime.
          filteredBuilds.sort((a, b) => {
            const aStart = Number(a.startTime);
            const bStart = Number(b.startTime);
            return sortOrder === "asc" ? aStart - bStart : bStart - aStart;
          });
          
          if (filteredBuilds.length > 0) {
            let outputHtml = `<h3>Jobs triggered in the last ${hours} hour(s):</h3>`;
            filteredBuilds.forEach(build => {
              const startDate = new Date(build.startTime).toLocaleString();
              const finishedDate = build.status === "IN-PROGRESS" ? "In progress" : new Date(build.finishTime).toLocaleString();
              outputHtml += `<div style="margin-bottom:10px;">
                <strong style="font-size:1.2em;">Job: ${build.jobName}</strong><br>
                &#128279; Link: <a href="${build.jobLink}" target="_blank">Link to job</a><br>
                &#128202; Status: ${build.status}<br>
                Started at: ${startDate}<br>
                Finished at: ${finishedDate}<br>
                <hr>
              </div>`;
            });
            resultsPre.innerHTML = outputHtml;
            statusDiv.textContent = 'Filtered data fetched successfully!';
          } else {
            resultsPre.innerHTML = `<p>No jobs found for user within the last ${hours} hour(s).</p>`;
            statusDiv.textContent = '';
          }
        })
        .catch(error => {
          statusDiv.textContent = error.message;
        });
    });
  });
});
