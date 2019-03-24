browser.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'PU-CALC') {
    return calculate(msg.start, msg.end);
  }
});

/**
 * Turns the 'calendar-like' data received from Zenit
 * into a subject-based report object
 * @param data - list of lesson data objects
 * @param now - datetime of when the request was processed
 * @return {Object} - of subjects and their statistics
 */
function process(data, now) {
  let subjs = {};

  // Sum up all lessons
  for (var i = 0, len = data.length; i < len; i++) {
    let lessonID = data[i].subjectShortName;

    // Check if new subject
    if (!subjs.hasOwnProperty(lessonID)) {
      subjs[lessonID] = {
        shortname: lessonID,
        total: 0,
        locked: 0,
        excused: 0,
        absent: 0,
        late: 0,
        present: 0,
        lExcused: 0, // Late, excused
        empty: 0,
        substitutes: 0 // The number of times this subject is a substitute for another subject
      }
    }

    subjs[lessonID].total++;
    if (data[i].isSub) { subjs[lessonID].substitutes++; }
    let par = data[i].PupilsAttendanceRecords[0];
    if (par.isLocked) { subjs[lessonID].locked++; }
    if (par.isExcused) {
      if (par.isLate) { subjs[lessonID].lExcused++; }
      else { subjs[lessonID].excused++; }
      continue;
    }
    if (par.isPresent) { subjs[lessonID].present++; }
    else if (par.isAbsent) { subjs[lessonID].absent++; }
    else if (par.isLate) { subjs[lessonID].late++; }
    else { subjs[lessonID].empty++; subjs[lessonID].total--; }
  }

  // Calculate the percentages
  Object.keys(subjs).forEach((k) => {
    let o = subjs[k];
    let total = o.total;
    let percentage = {
      locked: (o.locked * 100 / total).toFixed(2),
      excused: (o.excused * 100 / total).toFixed(2),
      absent: (o.absent * 100 / total).toFixed(2),
      late: (o.late * 100 / total).toFixed(2),
      present: (o.present * 100 / total).toFixed(2),
      lExcused: (o.lExcused * 100 / total).toFixed(2),
      substitutes: (o.substitutes * 100 / total).toFixed(2),
      empty: (o.empty * 100 / total).toFixed(2)
    }
    o.percentage = percentage;
  });
  return {now, data: subjs};
}

/**
 * Opens the 'previous results' page or, if it's already open,
 * creates a notification to inform the user that a report is ready
 */
function openPrevRes() {
  const url = browser.runtime.getURL("pg/results.html");
  browser.tabs.query({url}).then((tabs) => {
    if (!tabs.length) {
      browser.tabs.create({
        url: browser.runtime.getURL("pg/results.html")
      });
      return;
    }
    browser.notifications.create({
      "type": "basic",
      "title": "Zenit obecność",
      "message": "Raport obecności gotowy"
    });
  });
}

/**
 * The 'main' function. Requests data from a content script,
 * prepares it for process() and handles errors
 * @param startDate - of the time period for which we generate a report
 * @param endDate - of that time period
 */
function calculate(startDate, endDate) {
  return new Promise(function(resolve, reject) {
    browser.tabs.query({url: "https://zenit.efendi.pl/*/*"}).then((tabs) => {

      // Check if any valid Zenit tabs are open
      if (!tabs.length) {
        reject(new Error("Nie wykryto karty z otwartym dziennikiem"));
        return;
      }

      // Request data from the youngest content script
      browser.tabs.sendMessage(tabs[tabs.length - 1].id, {type:'BG-REQ', start:startDate, end:endDate}).then((data) => {

        // Data starts with '<par>', probably, so remove that
        if (data[0] === '<') {
          data = data.substring(5);
        }
        data = JSON.parse(data);

        // This means the user is probably not logged in, so display the appropriate message
        if (data.data.code === "zForceLogout('Your session is not alive. Refresh page will be done.');") {
          reject(new Error("Zaloguj się ponownie"));
          return;
        }

        // The operation was unsuccessful for some other reason
        if (!data.success) {
          let msg = data.message || data.data;
          reject(new Error("Operacja nie powiodła się: " + msg));
          return;
        }

        data = process(data.data.absence, data.now);
        console.log(data);

        // Save the results
        browser.storage.local.get(['results'], function(res) {
            if (!res.results || res.results.constructor !== Array) {
              res.results = [];
            }

            res.results.push({...data, startDate, endDate});

            browser.storage.local.set({'results': res.results}).then(() => {
              openPrevRes();
              resolve();
            }, (err) => {
              reject(new Error("Storage error: " + err));
            });
        });

      }, (err) => {
        console.error("sendMessage error: " + err);
      });
    }, (err) => {
      console.error("Tab query error: " + err);
    });
  });
}
