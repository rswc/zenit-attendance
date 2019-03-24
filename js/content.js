browser.runtime.onMessage.addListener((msg) => {
  let t = msg.type;
  if (t === 'BG-REQ') {
    return requestData(msg.start, msg.end);
  }
});

function requestData(start, end) {
  return new Promise(function(resolve, reject) {
    var xhr = new content.XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.open("POST", "https://zenit.efendi.pl/lo3/?_module=studentdiary&_view=presence&_action=getpresences&id=0&_rtype=json");
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("cache-control", "no-cache");
    xhr.onload = () => resolve(xhr.responseText);
    xhr.onerror = () => reject(xhr.statusText);

    xhr.send(`_json=["${start}","${end}"]`);
  });
}
