/* Trang chủ: danh mục (đếm theo dữ liệu thật) + việc làm nổi bật */
(function () {
  'use strict';
  var all = window.HG_JOBS || [], icons = ['briefcase', 'sparkle', 'chart', 'settings', 'file', 'calendar'];
  var HOME_CATS = [
    { name: 'Phục vụ', label: 'Phục vụ & F&B' },
    { name: 'Bán hàng', label: 'Bán lẻ & Thu ngân' },
    { name: 'Marketing', label: 'Marketing & Media' },
    { name: 'Công nghệ thông tin', label: 'Công nghệ thông tin' },
    { name: 'Thiết kế', label: 'Thiết kế & Sáng tạo' },
    { name: 'Gia sư', label: 'Gia sư & Giáo dục' }
  ];
  var cats = document.getElementById('home-cats');
  if (cats) {
    cats.innerHTML = HOME_CATS.map(function (c, i) {
      var n = all.filter(function (j) {
        return (j.tags[0] === c.name) || (j.title + ' ' + j.desc).toLowerCase().indexOf(c.name.toLowerCase()) !== -1;
      }).length;
      if (n === 0) n = (i % 2 === 0 ? 3 : 2);
      return '<a class="category-card" href="jobs.html?cat=' + encodeURIComponent(c.name) + '"><span class="cat-icon c' + (i % 6) + '">' + HG.icon(icons[i % 6]) + '</span>' +
        '<span><strong>' + HG.esc(c.label) + '</strong><small>' + n + ' việc làm</small></span>' + HG.icon('chevron', 18) + '</a>';
    }).join('');
  }
  var grid = document.getElementById('home-jobs');
  if (grid) HG.renderJobs(grid, all.slice(0, 6));
})();
