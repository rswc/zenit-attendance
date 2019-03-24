const DATA = document.getElementById('data');
const LIST_ELEMENT = document.getElementById('tpl_list-element');
const RESULT_ELEMENT = document.getElementById('tpl_result');

document.getElementById('btn_clear').addEventListener('click', function () {
  browser.storage.local.clear();
});

browser.storage.local.get(['results'], function(res) {

  // No entries, so display a message
  if (!res.results) {
    DATA.innerText = "Użyj ikony dodatku na pasku narzędzi, aby wygenerować nowy raport";
    return;
  }
  
  let results = res.results;
  for (var i = 0, len = results.length; i < len; i++) {
    let el = document.importNode(LIST_ELEMENT.content, true);
    el.querySelector('.le_date').innerText = `Wykonano ${results[i].now}, dla okresu <${results[i].startDate}; ${results[i].endDate}>`;

    Object.keys(results[i].data).forEach((k) => {
      let o = results[i].data[k];
      let p = o.percentage;
      let el2 = document.importNode(RESULT_ELEMENT.content, true);
      el2.querySelector('.res_name').innerText = k;
      el2.querySelector('.res_data').innerText =
      `${o.present} (${p.present}%)
      ${o.absent} (${p.absent}%)
      ${o.excused} (${p.excused}%)
      ${o.late} (${p.late}%)
      ${o.lExcused} (${p.lExcused}%)
      ${o.total}
      ${o.empty}
      ${o.substitutes}`;
      el.querySelector('.le_results').appendChild(el2);
    });
    DATA.appendChild(el);
  }
});
