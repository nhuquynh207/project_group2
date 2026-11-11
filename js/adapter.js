/* Cầu nối mock-data.js -> giao diện: ghép dữ liệu, định dạng, và lưu thay đổi khi test (localStorage) */
(function () {
  'use strict';
  var HG = window.HG;
  var COLORS = ['#665CF6', '#FF8EC7', '#4F7DFF', '#A78BFA', '#22B8A7', '#3156C8'];
  var TYPES = { 'part-time': 'Part-time', 'full-time': 'Toàn thời gian', 'internship': 'Thực tập' };

  /* Tin do nhà tuyển dụng đăng thêm + trạng thái do admin duyệt (lưu trong trình duyệt) */
  HG.read('hg_new_jobs', []).forEach(function (j) { jobs.push(j); });
  var overrides = HG.read('hg_job_status', {});
  jobs.forEach(function (j) { if (overrides[j.id]) Object.assign(j, overrides[j.id]); });

  HG.now = function () {
    var d = new Date(), p = function (n) { return ('0' + n).slice(-2); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  };
  HG.typeLabel = function (t) { return TYPES[t] || t; };
  HG.addJob = function (j) { var l = HG.read('hg_new_jobs', []); l.push(j); HG.write('hg_new_jobs', l); jobs.push(j); };
  HG.setJobStatus = function (id, status) {
    var patch = {
      status: status,
      approved_by: status === 'approved' ? 6 : null,
      approved_at: status === 'approved' ? HG.now() : null,
      rejected_reason: status === 'rejected' ? 'Không đáp ứng tiêu chí đăng tin.' : null
    };
    overrides[id] = patch; HG.write('hg_job_status', overrides);
    Object.assign(jobs.find(function (j) { return j.id === id; }), patch);
  };

  HG.locationName = function (id) {
    var parts = [], l = job_locations.find(function (x) { return x.id === id; });
    while (l) { parts.push(l.name); l = l.parent_id ? job_locations.find(function (x) { return x.id === l.parent_id; }) : null; }
    return parts.join(', ');
  };
  function salary(j) {
    if (j.salary_text) return j.salary_text;
    var a = j.salary_min, b = j.salary_max;
    return b >= 1e6 ? a / 1e6 + '–' + b / 1e6 + ' triệu' : a / 1e3 + '–' + b / 1e3 + 'K/giờ';
  }
  /* 1 bản ghi jobs  ->  object cho thẻ việc làm */
  HG.toJob = function (j) {
    var e = employer_profiles.find(function (x) { return x.id === j.employer_id; }) || { company_name: '?' };
    var c = job_categories.find(function (x) { return x.id === j.category_id; });
    return {
      id: j.id, title: j.title, company: e.company_name,
      location: j.location_text || HG.locationName(j.location_id),
      salary: salary(j), type: HG.typeLabel(j.job_type),
      logo: e.company_name.charAt(0), color: COLORS[(j.employer_id - 1) % COLORS.length],
      tags: [c ? c.name : 'Khác', HG.typeLabel(j.job_type)], desc: j.description, raw: j
    };
  };
  HG.employerColor = function (id) { return COLORS[(id - 1) % COLORS.length]; };

  /* Trang công khai chỉ hiện tin đã được duyệt */
  window.HG_JOBS = jobs.filter(function (j) { return j.status === 'approved'; }).map(HG.toJob);
})();
