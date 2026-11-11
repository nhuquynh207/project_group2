/* Trang tìm việc: lọc theo từ khóa, khu vực, danh mục, hình thức, remote, lương tối thiểu, sắp xếp, tải thêm */
(function () {
  'use strict';
  var all = window.HG_JOBS || [];
  var list = document.getElementById('job-list');
  var term = document.getElementById('term');
  var area = document.getElementById('area');
  var remote = document.getElementById('remote');
  var searchBtn = document.getElementById('search-btn');
  var salaryRange = document.getElementById('salary-range');
  var salaryVal = document.getElementById('salary-val');
  var sortSelect = document.getElementById('sort-select');
  var count = document.getElementById('result-count');
  var empty = document.getElementById('empty-state');
  var loadMoreBtn = document.getElementById('load-more');
  var clearBtn = document.getElementById('clear-filters');
  var checks = [].slice.call(document.querySelectorAll('.filters input[data-filter]'));

  /* Mobile filter drawer */
  var sidebar = document.getElementById('filters-sidebar');
  var backdrop = document.getElementById('filters-backdrop');
  var openFilterBtn = document.getElementById('open-filter-mobile');
  var closeFilterBtn = document.getElementById('filter-close');

  function toggleFilterDrawer(open) {
    if (sidebar) sidebar.classList.toggle('open', open);
    if (backdrop) backdrop.hidden = !open;
  }
  if (openFilterBtn) openFilterBtn.addEventListener('click', function() { toggleFilterDrawer(true); });
  if (closeFilterBtn) closeFilterBtn.addEventListener('click', function() { toggleFilterDrawer(false); });
  if (backdrop) backdrop.addEventListener('click', function() { toggleFilterDrawer(false); });

  /* Đọc tham số từ URL */
  var params = new URLSearchParams(location.search);
  if (params.get('q') && term) term.value = params.get('q');
  if (params.get('area') && area) area.value = params.get('area');

  var catParam = params.get('cat');
  checks.forEach(function (c) {
    if (c.dataset.filter === 'cat' && catParam && c.value.toLowerCase().indexOf(catParam.toLowerCase()) !== -1) {
      c.checked = true;
    }
  });

  /* Mức lương */
  if (salaryRange && salaryVal) {
    salaryRange.addEventListener('input', function() {
      salaryVal.textContent = 'Từ ' + salaryRange.value + 'K/giờ';
      render();
    });
  }

  function picked(key) {
    return checks.filter(function (c) { return c.dataset.filter === key && c.checked; }).map(function (c) { return c.value; });
  }

  function updateCounts() {
    checks.forEach(function (c) {
      var isCat = c.dataset.filter === 'cat';
      var n = all.filter(function (j) {
        return isCat ? (j.tags[0] === c.value) : (j.type === c.value);
      }).length;
      var countEl = c.parentNode.querySelector('[data-count]');
      if (countEl) countEl.textContent = n;
    });
  }
  updateCounts();

  var pageSize = 6;
  var visibleCount = pageSize;

  function render() {
    var t = (term ? term.value : '').trim().toLowerCase();
    var a = (area ? area.value : '').trim().toLowerCase();
    var cats = picked('cat');
    var types = picked('type');
    var minWage = salaryRange ? Number(salaryRange.value) * 1000 : 0;
    var sort = sortSelect ? sortSelect.value : 'newest';

    var filtered = all.filter(function (j) {
      var matchKw = !t || (j.title + ' ' + j.company + ' ' + j.tags.join(' ')).toLowerCase().indexOf(t) !== -1;
      var matchArea = !a || j.location.toLowerCase().indexOf(a) !== -1;
      var matchRemote = !remote.checked || /xa|remote/i.test(j.location + ' ' + (j.raw ? j.raw.work_time : ''));
      var matchCat = !cats.length || cats.indexOf(j.tags[0]) !== -1;
      var matchType = !types.length || types.indexOf(j.type) !== -1;

      var matchWage = true;
      if (minWage > 20000 && j.raw && j.raw.salary_max) {
        matchWage = j.raw.salary_max >= minWage;
      }
      return matchKw && matchArea && matchRemote && matchCat && matchType && matchWage;
    });

    if (sort === 'salary') {
      filtered.sort(function(x, y) {
        var sx = x.raw ? (x.raw.salary_max || x.raw.salary_min || 0) : 0;
        var sy = y.raw ? (y.raw.salary_max || y.raw.salary_min || 0) : 0;
        return sy - sx;
      });
    } else if (sort === 'title') {
      filtered.sort(function(x, y) { return x.title.localeCompare(y.title); });
    } else {
      filtered.sort(function(x, y) { return y.id - x.id; });
    }

    var toShow = filtered.slice(0, visibleCount);
    HG.renderJobs(list, toShow);

    count.textContent = filtered.length + ' việc làm phù hợp';
    empty.hidden = filtered.length !== 0;

    if (loadMoreBtn) {
      loadMoreBtn.hidden = visibleCount >= filtered.length || filtered.length === 0;
    }
  }

  if (term) term.addEventListener('input', function() { visibleCount = pageSize; render(); });
  if (searchBtn) searchBtn.addEventListener('click', function() { visibleCount = pageSize; render(); });
  if (area) area.addEventListener('change', function() { visibleCount = pageSize; render(); });
  if (remote) remote.addEventListener('change', function() { visibleCount = pageSize; render(); });
  if (sortSelect) sortSelect.addEventListener('change', render);

  checks.forEach(function (c) {
    c.addEventListener('change', function() { visibleCount = pageSize; render(); });
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (term) term.value = '';
      if (area) area.value = '';
      if (remote) remote.checked = false;
      if (salaryRange) {
        salaryRange.value = 20;
        if (salaryVal) salaryVal.textContent = 'Từ 20K/giờ';
      }
      if (sortSelect) sortSelect.value = 'newest';
      checks.forEach(function (c) { c.checked = false; });
      visibleCount = pageSize;
      render();
    });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      visibleCount += pageSize;
      render();
    });
  }

  render();
})();
