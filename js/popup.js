var start = document.getElementById('date_start');
var end = document.getElementById('date_end');
var errbox = document.getElementById('errbox');

function setError(text) {
  if (!errbox.innerText) { errbox.classList.remove('hidden'); }
  errbox.innerText = text;
}

document.getElementById('btn-role_calculate').addEventListener('click', function () {
  if (start.value && end.value && Date.parse(start.value) && Date.parse(end.value)) {
    browser.runtime.sendMessage({type: "PU-CALC", start: start.value, end: end.value}).catch((err) => {
      setError(err);
    });
  } else {
    document.body.classList.add('inputerr');
    setError('Proszę wprowadzić poprawne daty');
  }
});

document.getElementById('btn-role_results').addEventListener('click', function () {
  browser.tabs.create({
    url: browser.extension.getURL("pg/results.html")
  });
});
