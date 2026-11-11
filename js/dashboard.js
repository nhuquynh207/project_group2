/* Dashboard sinh viên / nhà tuyển dụng / admin - đầy đủ tính năng cho mọi vai trò */
(function () {
  'use strict';
  var I = HG.icon, E = HG.esc, JOBS = jobs;
  var role = document.body.dataset.role, user = HG.user();

  /* Chưa đăng nhập hoặc sai vai trò -> chuyển về auth.html */
  if (!user || user.role !== role) {
    location.replace('auth.html?role=' + role + '&next=' + location.pathname.split('/').pop() + '&notice=' + encodeURIComponent('Vui lòng đăng nhập để vào trang này.'));
    return;
  }

  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return ('0' + n).slice(-2); };
  function initials(n) {
    if (!n) return 'U';
    var p = n.trim().split(/\s+/);
    return (p[0].charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : '')).toUpperCase();
  }
  function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  function jobOf(a) { return byId(JOBS, a.job_id) || { title: 'Việc làm #' + a.job_id, employer_id: 1 }; }
  function companyOf(j) { return byId(employer_profiles, j.employer_id) || { company_name: 'Doanh nghiệp', id: 1 }; }
  function statusName(id) {
    var st = byId(application_statuses, id);
    return st ? st.name : 'submitted';
  }
  var STATUS = {
    submitted: ['Đã nộp', 'pending'],
    reviewing: ['Đang xem xét', 'reviewing'],
    interview: ['Mời phỏng vấn', 'interview'],
    accepted: ['Đã trúng tuyển', 'accepted'],
    rejected: ['Từ chối', ''],
    withdrawn: ['Đã rút đơn', '']
  };

  function setStat(key, value, sub) {
    var el = document.querySelector('[data-stat="' + key + '"]');
    if (!el) return;
    el.textContent = value;
    var em = el.parentNode.querySelector('em');
    if (em) em.textContent = sub || '';
  }

  function after(sectionId, html) {
    var el = $(sectionId);
    if (el) el.insertAdjacentHTML('beforeend', html);
  }

  /* ---- Toast thông báo nổi ---- */
  function showToast(msg) {
    var old = document.querySelector('.dash-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'dash-toast';
    t.innerHTML = I('check', 18) + '<span>' + E(msg) + '</span>';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  /* ---- Header thông tin người dùng ---- */
  var display = user.full_name, emp = null;
  if (role === 'employer') {
    emp = employer_profiles.filter(function (e) { return e.user_id === user.id; })[0];
    if (emp) display = emp.company_name;
  }
  var avatarEl = document.querySelector('.dash-avatar');
  if (avatarEl) avatarEl.textContent = initials(display);
  var nameStrong = document.querySelector('.user-name strong');
  if (nameStrong) nameStrong.textContent = display;

  /* Nút đăng xuất ở header */
  var headerRight = document.querySelector('.dash-header > div:last-child');
  if (headerRight && !$('logout-btn')) {
    headerRight.insertAdjacentHTML('beforeend', '<button class="logout-btn" id="logout-btn" type="button" aria-label="Đăng xuất">' + I('logout', 18) + '<span>Đăng xuất</span></button>');
  }

  /* Thông báo ở header dashboard */
  var notifyBtn = document.querySelector('.dash-header .notify');
  if (notifyBtn) {
    var notifs = {
      student: [
        { text: 'Lumos Studio vừa phản hồi đơn ứng tuyển của bạn', time: '10 phút trước', unread: true },
        { text: 'Lịch phỏng vấn sắp tới: Ca làm việc tại Highlands Coffee', time: 'Hôm nay 17:00', unread: true },
        { text: 'Có 3 việc làm mới ngành Marketing phù hợp với ca rảnh của bạn', time: 'Hôm qua', unread: false }
      ],
      employer: [
        { text: 'Có 2 ứng viên mới nộp đơn vào vị trí Trợ lý Marketing', time: '15 phút trước', unread: true },
        { text: 'Tin tuyển dụng "Nhân viên pha chế" đã được duyệt', time: '1 giờ trước', unread: true },
        { text: 'Báo cáo: 45 lượt xem tin trong 24 giờ qua', time: 'Hôm qua', unread: false }
      ],
      admin: [
        { text: 'Có 1 tin tuyển dụng mới đang chờ duyệt từ Highlands Coffee', time: '5 phút trước', unread: true },
        { text: '1 báo cáo vi phạm mới từ sinh viên cần xử lý', time: '30 phút trước', unread: true },
        { text: 'Hệ thống ghi nhận 15 lượt đăng ký tài khoản mới hôm nay', time: 'Hôm nay', unread: false }
      ]
    }[role] || [];

    var dropHtml = '<div class="dash-notify-dropdown" id="dash-notify-dropdown">' +
      '<div class="notify-popover-head"><strong>Thông báo (' + notifs.filter(function(x){return x.unread;}).length + ')</strong><button type="button" id="dash-mark-read">Đã đọc</button></div>' +
      '<div class="notify-popover-list">' +
      notifs.map(function(n) {
        return '<div class="notify-item' + (n.unread ? ' unread' : '') + '">' +
          '<span class="notify-item-icon">' + I('bell', 16) + '</span>' +
          '<div class="notify-item-content"><strong>' + E(n.text) + '</strong><small>' + E(n.time) + '</small></div>' +
          '</div>';
      }).join('') +
      '</div></div>';

    document.querySelector('.dash-header').insertAdjacentHTML('beforeend', dropHtml);
    var notifyDropdown = $('dash-notify-dropdown');

    notifyBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      notifyDropdown.classList.toggle('show');
    });

    var markBtn = $('dash-mark-read');
    if (markBtn) {
      markBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        notifyDropdown.querySelectorAll('.notify-item.unread').forEach(function(el){ el.classList.remove('unread'); });
        var dot = notifyBtn.querySelector('i');
        if (dot) dot.remove();
        notifyDropdown.querySelector('.notify-popover-head strong').textContent = 'Thông báo (0)';
      });
    }

    document.addEventListener('click', function(e) {
      if (notifyDropdown && !notifyDropdown.contains(e.target) && e.target !== notifyBtn) {
        notifyDropdown.classList.remove('show');
      }
    });
  }

  /* Nút tìm kiếm nhanh */
  var dashSearch = document.querySelector('.dash-search');
  if (dashSearch) {
    dashSearch.addEventListener('click', function() {
      if (role === 'student') showTab(3);
      else if (role === 'employer') showTab(2);
      else showTab(3);
    });
  }

  /* ---- Sidebar drawer trên mobile ---- */
  var sidebar = $('dash-sidebar'), backdrop = $('dash-backdrop'), menuBtn = $('dash-menu');
  function toggleDrawer(open) {
    if (sidebar) sidebar.classList.toggle('open', open);
    if (backdrop) backdrop.hidden = !open;
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open));
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { toggleDrawer(!sidebar.classList.contains('open')); });
  if (backdrop) backdrop.addEventListener('click', function () { toggleDrawer(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggleDrawer(false); });

  /* ---- Chuyển tab sidebar ---- */
  var tabs = document.querySelectorAll('.dash-sidebar nav [data-tab]');
  var views = document.querySelectorAll('.dash-view');
  var placeholder = $('dash-placeholder');

  function showTab(n) {
    tabs.forEach(function (t) { t.classList.toggle('active', t.dataset.tab === String(n)); });
    var found = false;
    views.forEach(function (v) {
      var on = v.dataset.view === String(n);
      v.hidden = !on;
      if (on) found = true;
    });
    if (placeholder) placeholder.hidden = found;
    if (!found && placeholder) {
      var title = (tabs[n] && tabs[n].querySelector('span')) ? tabs[n].querySelector('span').textContent : 'Mục quản lý';
      placeholder.innerHTML = '<div class="placeholder-panel"><span>' + I('sparkle', 30) + '</span><h1>' + title + '</h1>' +
        '<p>Khu vực quản lý ' + title.toLowerCase() + ' của bạn. Dữ liệu đã sẵn sàng để trải nghiệm.</p>' +
        '<button class="primary-btn" onclick="location.reload()">Làm mới trang ' + I('arrow') + '</button></div>';
    }
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      showTab(Number(t.dataset.tab));
      toggleDrawer(false);
    });
  });

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-goto-tab]');
    if (b) {
      e.preventDefault();
      showTab(Number(b.dataset.gotoTab));
    }
  });

  /* Mở tab theo URL query parameter ?tab=X */
  var params = new URLSearchParams(location.search);
  if (params.get('tab') !== null) {
    showTab(Number(params.get('tab')));
  }

  /* =========================================================
     1. SINH VIÊN (STUDENT)
     ========================================================= */
  if (role === 'student') {
    var sid = HG.studentId(user) || 1;
    var profile = student_profiles.filter(function (p) { return p.user_id === user.id; })[0] || student_profiles[0];
    var now = new Date();

    var firstName = (user.full_name || '').split(' ').pop();
    var fnEl = document.querySelector('[data-first-name]');
    if (fnEl) fnEl.textContent = firstName;

    var todayEl = $('today');
    if (todayEl) {
      todayEl.textContent = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY'][now.getDay()] + ', ' + now.getDate() + ' THÁNG ' + (now.getMonth() + 1);
    }

    /* Đơn ứng tuyển */
    var getStudentApps = function() {
      return HG.applications().filter(function (a) { return a.student_id === sid; })
        .sort(function (a, b) { return (b.applied_at || '').localeCompare(a.applied_at || ''); });
    };

    var updateStudentStats = function() {
      var apps = getStudentApps();
      var interviews = apps.filter(function (a) { return statusName(a.status_id) === 'interview'; }).length;
      setStat('apps', apps.length, 'Tổng số đơn đã nộp');
      setStat('saved', HG.getSaved().length, 'Việc yêu thích');
      setStat('interviews', interviews, 'Đang chờ phỏng vấn');

      var appBadge = document.querySelector('.dash-sidebar nav button[data-tab="4"] b');
      if (appBadge) appBadge.textContent = apps.length;
    };
    updateStudentStats();

    /* Tab 0: Đơn gần đây */
    var secApps = $('student-apps');
    if (secApps) {
      secApps.querySelectorAll('.app-row, .empty-note').forEach(function(el){ el.remove(); });
      var apps = getStudentApps();
      secApps.insertAdjacentHTML('beforeend', apps.slice(0, 5).map(function (a) {
        var j = jobOf(a), c = companyOf(j), st = STATUS[statusName(a.status_id)] || ['Đã nộp', 'pending'];
        return '<div class="app-row"><span class="company-logo" style="background:' + HG.employerColor(c.id) + '">' + E(c.company_name.charAt(0)) + '</span>' +
          '<div><strong>' + E(j.title) + '</strong><small>' + E(c.company_name) + '</small></div>' +
          '<span class="status ' + st[1] + '">' + st[0] + '</span><small>' + HG.fmtDate(a.applied_at) + '</small></div>';
      }).join('') || '<p class="empty-note">Chưa có đơn ứng tuyển nào.</p>');
    }

    /* Tab 0: Lịch tuần này */
    var weekDaysEl = $('week-days');
    if (weekDaysEl) {
      var dow = (now.getDay() + 6) % 7, mon = new Date(now);
      mon.setDate(now.getDate() - dow);
      weekDaysEl.innerHTML = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(function (d, i) {
        var day = new Date(mon); day.setDate(mon.getDate() + i);
        return '<span' + (i === dow ? ' class="today"' : '') + '><small>' + d + '</small><b>' + day.getDate() + '</b></span>';
      }).join('');
    }

    var secWeek = $('student-week');
    if (secWeek) {
      var todayStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
      var ev = schedules.filter(function (s) { return s.student_id === sid && (s.start_datetime || '').slice(0, 10) >= todayStr; })
        .sort(function (a, b) { return (a.start_datetime || '').localeCompare(b.start_datetime || ''); }).slice(0, 3);
      secWeek.querySelectorAll('.event-card, .empty-note').forEach(function(el){ el.remove(); });
      after('student-week', ev.map(function (s, i) {
        return '<div class="event-card' + (i % 2 ? ' pink' : '') + '"><i></i><span><small>' + s.start_datetime.slice(8, 10) + '/' + s.start_datetime.slice(5, 7) + ' · ' +
          s.start_datetime.slice(11, 16) + ' – ' + s.end_datetime.slice(11, 16) + '</small><strong>' + E(s.title) + '</strong></span></div>';
      }).join('') || '<p class="empty-note">Chưa có lịch sắp tới.</p>');
    }

    /* Tab 0: Gợi ý dành riêng */
    var recEl = $('recommended');
    if (recEl) {
      var appliedIds = getStudentApps().map(function (a) { return a.job_id; });
      recEl.innerHTML = (window.HG_JOBS || []).filter(function (j) { return appliedIds.indexOf(j.id) === -1; }).slice(0, 3).map(function (j) {
        var isSaved = HG.isSaved(j.id);
        return '<div style="cursor:pointer;" onclick="location.href=\'job-detail.html?id=' + j.id + '\'">' +
          '<span class="company-logo" style="background:' + j.color + '">' + E(j.logo) + '</span>' +
          '<div><strong>' + E(j.title) + '</strong><small>' + E(j.company) + ' · ' + E(j.location) + '</small></div>' +
          '<b>' + E(j.salary) + '</b>' +
          '<button type="button" class="dash-save-btn' + (isSaved ? ' saved' : '') + '" data-rec-job="' + j.id + '" onclick="event.stopPropagation();">' +
            I('bookmark', 18) +
          '</button>' +
          '</div>';
      }).join('') || '<p class="empty-note">Bạn đã ứng tuyển tất cả việc làm hiện có.</p>';

      recEl.addEventListener('click', function(e) {
        var b = e.target.closest('[data-rec-job]');
        if (b) {
          e.stopPropagation();
          var jid = Number(b.dataset.recJob);
          var saved = HG.toggleSaved(jid);
          b.classList.toggle('saved', saved);
          updateStudentStats();
          renderSavedJobs();
          showToast(saved ? 'Đã lưu việc làm vào mục yêu thích!' : 'Đã bỏ lưu việc làm.');
        }
      });
    }

    /* TAB 1: HỒ SƠ CÁ NHÂN */
    var profAvatar = $('prof-avatar'), profDispName = $('prof-display-name'), profDispSub = $('prof-display-sub');
    var inName = $('prof-fullname'), inEmail = $('prof-email'), inPhone = $('prof-phone'), inDob = $('prof-dob'), inAddress = $('prof-address');
    var inUni = $('prof-uni'), inMajor = $('prof-major'), inBio = $('prof-bio');

    function syncProfileDisplay() {
      if (profAvatar) profAvatar.textContent = initials(user.full_name);
      if (profDispName) profDispName.textContent = user.full_name;
      if (profDispSub) profDispSub.textContent = (profile.major || 'Sinh viên') + ' · ' + (profile.university || 'Chưa cập nhật trường');
      if (inName) inName.value = user.full_name || '';
      if (inEmail) inEmail.value = user.email || '';
      if (inPhone) inPhone.value = user.phone || '';
      if (inDob) inDob.value = profile.date_of_birth || '';
      if (inAddress) inAddress.value = profile.address || '';
      if (inUni) inUni.value = profile.university || '';
      if (inMajor) inMajor.value = profile.major || '';
      if (inBio) inBio.value = profile.bio || '';
    }
    syncProfileDisplay();

    /* Kỹ năng */
    var studentSkills = HG.read('hg_skills_' + sid, ['Giao tiếp tốt', 'Tiếng Anh', 'Tin học văn phòng', 'Làm việc nhóm', 'Pha chế']);
    var skillsWrap = $('student-skills-container');
    function renderSkills() {
      if (!skillsWrap) return;
      skillsWrap.innerHTML = studentSkills.map(function(s, i) {
        return '<span class="skill-tag">' + E(s) + '<button type="button" data-del-skill="' + i + '" title="Xóa">&times;</button></span>';
      }).join('');
    }
    renderSkills();

    if (skillsWrap) {
      skillsWrap.addEventListener('click', function(e) {
        var b = e.target.closest('[data-del-skill]');
        if (b) {
          studentSkills.splice(Number(b.dataset.delSkill), 1);
          HG.write('hg_skills_' + sid, studentSkills);
          renderSkills();
        }
      });
    }

    var addSkillBtn = $('add-skill-btn'), skillIn = $('new-skill-input');
    if (addSkillBtn && skillIn) {
      addSkillBtn.addEventListener('click', function() {
        var val = skillIn.value.trim();
        if (val && studentSkills.indexOf(val) === -1) {
          studentSkills.push(val);
          HG.write('hg_skills_' + sid, studentSkills);
          renderSkills();
          skillIn.value = '';
        }
      });
    }

    var profForm = $('student-profile-form');
    if (profForm) {
      profForm.addEventListener('submit', function(e) {
        e.preventDefault();
        user.full_name = inName.value.trim();
        user.email = inEmail.value.trim();
        user.phone = inPhone.value.trim();
        profile.university = inUni.value.trim();
        profile.major = inMajor.value.trim();
        profile.date_of_birth = inDob.value;
        profile.address = inAddress.value.trim();
        profile.bio = inBio.value.trim();
        profile.updated_at = HG.now();

        HG.write('hg_profile_' + user.id, profile);
        syncProfileDisplay();
        var userHeaderName = document.querySelector('.user-name strong');
        if (userHeaderName) userHeaderName.textContent = user.full_name;
        showToast('Cập nhật hồ sơ sinh viên thành công!');
      });
    }

    /* TAB 2: CV CỦA TÔI */
    var studentCvs = HG.read('hg_cvs_' + sid, cvs.filter(function(c) { return c.student_id === sid; }));
    if (!studentCvs.length) {
      studentCvs = [{ id: 1, student_id: sid, file_name: 'CV_' + user.full_name.replace(/\s+/g, '') + '.pdf', file_type: 'pdf', is_default: true, uploaded_at: HG.now() }];
    }

    var cvListEl = $('student-cv-list');
    function renderCvList() {
      if (!cvListEl) return;
      cvListEl.innerHTML = studentCvs.map(function(c) {
        var isDoc = c.file_type === 'docx' || c.file_name.endsWith('.docx');
        return '<div class="cv-card-item">' +
          '<div class="cv-info-left">' +
            '<span class="cv-file-icon' + (isDoc ? ' docx' : '') + '">' + I('file', 22) + '</span>' +
            '<div>' +
              '<strong>' + E(c.file_name) + (c.is_default ? ' <span class="prof-badge" style="font-size:10px;padding:1px 6px;">Mặc định</span>' : '') + '</strong>' +
              '<small>Đã tải lên: ' + HG.fmtDate(c.uploaded_at) + ' · ' + (isDoc ? 'Word Document' : 'PDF') + '</small>' +
            '</div>' +
          '</div>' +
          '<div class="cv-actions-right">' +
            '<button type="button" class="cv-action-btn" data-preview-cv="' + c.id + '">' + I('eye', 14) + ' Xem</button>' +
            (!c.is_default ? '<button type="button" class="cv-action-btn" data-default-cv="' + c.id + '">Đặt mặc định</button>' : '') +
            '<button type="button" class="cv-action-btn danger" data-del-cv="' + c.id + '" title="Xóa">' + I('trash', 14) + '</button>' +
          '</div>' +
        '</div>';
      }).join('') || '<p class="empty-note">Bạn chưa tải lên CV nào.</p>';
    }
    renderCvList();

    if (cvListEl) {
      cvListEl.addEventListener('click', function(e) {
        var defBtn = e.target.closest('[data-default-cv]');
        if (defBtn) {
          var cid = Number(defBtn.dataset.defaultCv);
          studentCvs.forEach(function(c) { c.is_default = (c.id === cid); });
          HG.write('hg_cvs_' + sid, studentCvs);
          renderCvList();
          showToast('Đã đặt làm CV ứng tuyển mặc định.');
          return;
        }

        var delBtn = e.target.closest('[data-del-cv]');
        if (delBtn) {
          var did = Number(delBtn.dataset.delCv);
          studentCvs = studentCvs.filter(function(c) { return c.id !== did; });
          if (studentCvs.length && !studentCvs.some(function(c) { return c.is_default; })) studentCvs[0].is_default = true;
          HG.write('hg_cvs_' + sid, studentCvs);
          renderCvList();
          showToast('Đã xóa CV thành công.');
          return;
        }

        var prevBtn = e.target.closest('[data-preview-cv]');
        if (prevBtn) {
          var pid = Number(prevBtn.dataset.previewCv);
          var cvItem = studentCvs.filter(function(x){return x.id === pid;})[0];
          HG.modal.open({
            className: 'modal-preview-cv',
            html: '<div style="padding: 10px;">' +
              '<h2 style="font-size: var(--fs-h4); margin-bottom: 8px;">Xem trước CV: ' + E(cvItem.file_name) + '</h2>' +
              '<p style="color:#7a8599; font-size: var(--fs-xs); margin-bottom: 16px;">Ứng viên: ' + E(user.full_name) + ' · Trường: ' + E(profile.university || 'Đại học') + '</p>' +
              '<div style="background:#f8f9fe; border: 1px solid #e2e6f4; border-radius: 12px; padding: 24px; min-height: 220px; font-size: var(--fs-body-sm); line-height: 1.7;">' +
                '<strong>MỤC TIÊU NGHỀ NGHIỆP:</strong><br>' + E(profile.bio || 'Tìm kiếm công việc part-time để trau dồi kỹ năng và tích lũy kinh nghiệm.') + '<br><br>' +
                '<strong>KỸ NĂNG:</strong><br>' + studentSkills.join(', ') + '<br><br>' +
                '<strong>HỌC VẤN:</strong><br>' + E(profile.university) + ' - Chuyên ngành ' + E(profile.major) + '<br><br>' +
                '<strong>LIÊN HỆ:</strong><br>Email: ' + E(user.email) + ' · SĐT: ' + E(user.phone) +
              '</div>' +
              '<div style="margin-top: 18px; text-align: right;">' +
                '<button type="button" class="primary-btn" data-close>Đóng xem trước</button>' +
              '</div>' +
            '</div>'
          });
        }
      });
    }

    var cvPicker = $('cv-file-picker');
    if (cvPicker) {
      cvPicker.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (file) {
          var ext = file.name.split('.').pop().toLowerCase();
          var newCv = {
            id: Date.now(),
            student_id: sid,
            file_name: file.name,
            file_type: ext,
            is_default: studentCvs.length === 0,
            uploaded_at: HG.now()
          };
          studentCvs.push(newCv);
          HG.write('hg_cvs_' + sid, studentCvs);
          renderCvList();
          showToast('Đã tải lên CV: ' + file.name);
          cvPicker.value = '';
        }
      });
    }

    /* TAB 3: VIỆC LÀM YÊU THÍCH */
    var savedContainer = $('saved-jobs-container');
    function renderSavedJobs() {
      if (!savedContainer) return;
      var savedIds = HG.getSaved();
      var allJ = window.HG_JOBS || jobs.map(HG.toJob);
      var savedList = allJ.filter(function (j) { return savedIds.indexOf(j.id) !== -1; });

      if (!savedList.length) {
        savedContainer.innerHTML = '<div style="background: #fff; border: 1px solid #e9edf8; border-radius: 18px; padding: 40px; text-align: center;">' +
          '<span style="width: 54px; height: 54px; border-radius: 50%; background: #fff0f7; color: #ff6fae; display: grid; place-items: center; margin: 0 auto 14px;">' + I('bookmark', 26) + '</span>' +
          '<h3>Chưa có việc làm nào trong danh sách yêu thích</h3>' +
          '<p style="color: #7b8599; font-size: var(--fs-body-sm); margin: 6px auto 18px; max-width: 420px;">Hãy lưu những công việc phù hợp với bạn khi duyệt danh sách việc làm để xem lại và ứng tuyển bất cứ lúc nào.</p>' +
          '<a class="primary-btn" href="jobs.html">Khám phá việc làm ngay ' + I('arrow') + '</a>' +
          '</div>';
        return;
      }

      savedContainer.innerHTML = savedList.map(function(j) {
        return '<div class="saved-job-card">' +
          '<div class="saved-job-info">' +
            '<span class="company-logo" style="background:' + j.color + '; width: 44px; height: 44px; font-size: 16px;">' + E(j.logo) + '</span>' +
            '<div>' +
              '<h3 style="font-size: var(--fs-body); margin-bottom: 4px;"><a href="job-detail.html?id=' + j.id + '">' + E(j.title) + '</a></h3>' +
              '<p style="color: #707a92; font-size: var(--fs-xs); margin: 0;">' + E(j.company) + ' · ' + E(j.location) + ' · <strong>' + E(j.salary) + '</strong></p>' +
            '</div>' +
          '</div>' +
          '<div class="saved-job-actions">' +
            '<button type="button" class="primary-btn small" onclick="HG.openModal(\'apply\', ' + j.id + ')">Ứng tuyển</button>' +
            '<button type="button" class="secondary-btn small" data-unsave-job="' + j.id + '">' + I('trash', 14) + ' Bỏ lưu</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }
    renderSavedJobs();

    if (savedContainer) {
      savedContainer.addEventListener('click', function(e) {
        var b = e.target.closest('[data-unsave-job]');
        if (b) {
          var jid = Number(b.dataset.unsaveJob);
          HG.toggleSaved(jid);
          updateStudentStats();
          renderSavedJobs();
          showToast('Đã xóa việc làm khỏi danh sách yêu thích.');
        }
      });
    }

    /* TAB 4: ĐƠN ỨNG TUYỂN */
    var fullAppsEl = $('student-apps-full');
    var activeAppFilter = 'all';

    function renderFullApps() {
      if (!fullAppsEl) return;
      var apps = getStudentApps();
      var filtered = apps.filter(function(a) {
        var sName = statusName(a.status_id);
        return activeAppFilter === 'all' || sName === activeAppFilter;
      });

      if (!filtered.length) {
        fullAppsEl.innerHTML = '<div style="background: #fff; border: 1px solid #e9edf8; border-radius: 18px; padding: 40px; text-align: center;">' +
          '<span style="width: 50px; height: 50px; border-radius: 50%; background: #eef2ff; color: #4f7dff; display: grid; place-items: center; margin: 0 auto 12px;">' + I('file', 24) + '</span>' +
          '<h3>Không có đơn ứng tuyển nào ở trạng thái này</h3>' +
          '<p style="color: #889; font-size: var(--fs-xs); margin-top: 4px;">Hãy thử chọn bộ lọc khác hoặc tìm kiếm công việc mới.</p>' +
          '</div>';
        return;
      }

      fullAppsEl.innerHTML = filtered.map(function(a) {
        var j = jobOf(a), c = companyOf(j), stName = statusName(a.status_id), st = STATUS[stName] || ['Đã nộp', 'pending'];
        var canWithdraw = stName === 'submitted' || stName === 'reviewing';

        return '<div class="app-card-detailed">' +
          '<div class="app-detailed-main">' +
            '<span class="company-logo" style="background:' + HG.employerColor(c.id) + '; width: 44px; height: 44px;">' + E(c.company_name.charAt(0)) + '</span>' +
            '<div>' +
              '<h3 style="font-size: var(--fs-body); margin-bottom: 4px;"><a href="job-detail.html?id=' + j.id + '">' + E(j.title) + '</a></h3>' +
              '<p style="color: #6a748c; font-size: var(--fs-xs); margin: 0;">' + E(c.company_name) + ' · Ngày nộp: ' + HG.fmtDate(a.applied_at) + '</p>' +
            '</div>' +
          '</div>' +
          '<div class="app-detailed-status">' +
            '<span class="status ' + st[1] + '" style="font-size: 13px; padding: 4px 12px;">' + st[0] + '</span>' +
            '<div style="display: flex; gap: 8px; margin-top: 6px;">' +
              '<a class="cv-action-btn" href="job-detail.html?id=' + j.id + '">' + I('eye', 14) + ' Xem tin</a>' +
              (canWithdraw ? '<button type="button" class="cv-action-btn danger" data-withdraw-app="' + a.id + '">Rút đơn</button>' : '') +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }
    renderFullApps();

    var appFilterTabs = $('app-filter-tabs');
    if (appFilterTabs) {
      appFilterTabs.addEventListener('click', function(e) {
        var b = e.target.closest('[data-app-filter]');
        if (b) {
          appFilterTabs.querySelectorAll('.dash-pill').forEach(function(p){ p.classList.remove('active'); });
          b.classList.add('active');
          activeAppFilter = b.dataset.appFilter;
          renderFullApps();
        }
      });
    }

    if (fullAppsEl) {
      fullAppsEl.addEventListener('click', function(e) {
        var wBtn = e.target.closest('[data-withdraw-app]');
        if (wBtn) {
          var aid = Number(wBtn.dataset.withdrawApp);
          HG.confirm({
            title: 'Rút đơn ứng tuyển?',
            message: 'Bạn có chắc chắn muốn rút hồ sơ ứng tuyển khỏi vị trí này không? Thao tác này không thể hoàn tác.',
            confirmText: 'Rút đơn',
            cancelText: 'Giữ lại',
            danger: true
          }).then(function(ok) {
            if (ok) {
              var allA = HG.applications();
              var target = allA.filter(function(x){ return x.id === aid; })[0];
              if (target) {
                target.status_id = 6; /* withdrawn */
                HG.write('hg_apps', allA.filter(function(x){ return x.id > 1000; }));
                updateStudentStats();
                renderFullApps();
                showToast('Đã rút đơn ứng tuyển thành công.');
              }
            }
          });
        }
      });
    }

    /* TAB 5: LỊCH TUẦN & ĐĂNG KÝ CA RẢNH */
    var calWeekEl = $('calendar-week-grid');
    if (calWeekEl) {
      var dow = (now.getDay() + 6) % 7, mon = new Date(now);
      mon.setDate(now.getDate() - dow);
      var days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
      var studentScheds = schedules.filter(function (s) { return s.student_id === sid; });

      calWeekEl.innerHTML = days.map(function(dName, i) {
        var dObj = new Date(mon); dObj.setDate(mon.getDate() + i);
        var dStr = dObj.getFullYear() + '-' + pad(dObj.getMonth() + 1) + '-' + pad(dObj.getDate());
        var isToday = (i === dow);
        var dayEvents = studentScheds.filter(function(s) { return (s.start_datetime || '').slice(0, 10) === dStr; });

        var evHtml = dayEvents.map(function(s) {
          return '<div class="cal-shift-badge' + (s.job_id ? '' : ' interview') + '">' +
            '<strong>' + s.start_datetime.slice(11, 16) + '</strong> ' + E(s.title) +
            '</div>';
        }).join('');

        return '<div class="calendar-day-col' + (isToday ? ' is-today' : '') + '">' +
          '<div class="cal-day-head">' +
            '<strong>' + dName + '</strong>' +
            '<b>' + dObj.getDate() + '/' + (dObj.getMonth() + 1) + '</b>' +
          '</div>' +
          (evHtml || '<div style="color: #b0b8c9; font-size: 11px; text-align: center; margin-top: 18px;">Trống ca</div>') +
        '</div>';
      }).join('');
    }

    /* Bảng ca rảnh */
    var availTbody = $('avail-tbody');
    var studentAvail = HG.read('hg_avail_' + sid, {
      morning: [false, true, false, true, false, true, false],
      afternoon: [false, false, true, false, true, false, false],
      evening: [true, true, true, true, true, false, false]
    });

    if (availTbody) {
      var shifts = [
        { key: 'morning', label: 'Ca sáng (08:00 – 12:00)' },
        { key: 'afternoon', label: 'Ca chiều (13:00 – 17:00)' },
        { key: 'evening', label: 'Ca tối (17:30 – 22:00)' }
      ];

      availTbody.innerHTML = shifts.map(function(shift) {
        var cells = [0, 1, 2, 3, 4, 5, 6].map(function(dIdx) {
          var checked = studentAvail[shift.key] && studentAvail[shift.key][dIdx];
          return '<td><input type="checkbox" class="avail-check-box" data-shift="' + shift.key + '" data-day="' + dIdx + '"' + (checked ? ' checked' : '') + '></td>';
        }).join('');
        return '<tr><td><strong>' + shift.label + '</strong></td>' + cells + '</tr>';
      }).join('');
    }

    var saveAvailBtn = $('save-avail-btn');
    if (saveAvailBtn) {
      saveAvailBtn.addEventListener('click', function() {
        var newAvail = { morning: [], afternoon: [], evening: [] };
        ['morning', 'afternoon', 'evening'].forEach(function(key) {
          for (var i = 0; i < 7; i++) {
            var cb = document.querySelector('input.avail-check-box[data-shift="' + key + '"][data-day="' + i + '"]');
            newAvail[key].push(cb ? cb.checked : false);
          }
        });
        HG.write('hg_avail_' + sid, newAvail);
        showToast('Đã lưu thời gian rảnh thành công!');
      });
    }

    /* TAB 6: CÀI ĐẶT */
    var pwForm = $('pw-form');
    if (pwForm) {
      pwForm.addEventListener('submit', function(e) {
        e.preventDefault();
        showToast('Đã đổi mật khẩu tài khoản thành công!');
        pwForm.reset();
      });
    }
    var prefForm = $('pref-form');
    if (prefForm) {
      prefForm.addEventListener('submit', function(e) {
        e.preventDefault();
        showToast('Đã lưu tùy chọn thông báo & bảo mật!');
      });
    }
  }

  /* =========================================================
     2. NHÀ TUYỂN DỤNG (EMPLOYER)
     ========================================================= */
  if (role === 'employer') {
    emp = employer_profiles.filter(function (e) { return e.user_id === user.id; })[0] || employer_profiles[0];
    var compEl = document.querySelector('[data-company]');
    if (compEl) compEl.textContent = emp.company_name;

    var JOB_STATUS = {
      approved: ['Đang hoạt động', 'accepted'],
      pending: ['Chờ duyệt', 'pending'],
      rejected: ['Bị từ chối', '']
    };

    var getOwnJobs = function () {
      return JOBS.filter(function (j) { return j.employer_id === emp.id; });
    };

    var getOwnApps = function () {
      var jobIds = getOwnJobs().map(function (j) { return j.id; });
      return HG.applications().filter(function (a) { return jobIds.indexOf(a.job_id) !== -1; })
        .sort(function (a, b) { return (b.applied_at || '').localeCompare(a.applied_at || ''); });
    };

    var renderEmployerOverview = function () {
      var own = getOwnJobs();
      var apps = getOwnApps();

      setStat('jobs', own.length, 'Tin đã đăng');
      setStat('applicants', apps.length, 'Tổng số đơn nhận được');
      setStat('active', own.filter(function (j) { return j.status === 'approved'; }).length, 'Đang hiển thị');
      setStat('new', apps.filter(function (a) { return statusName(a.status_id) === 'submitted'; }).length, 'Cần xem xét');

      /* Ứng viên mới ở Tab 0 */
      var secCands = $('employer-cands');
      if (secCands) {
        secCands.querySelectorAll('.candidate, .empty-note').forEach(function (n) { n.remove(); });
        var bg = ['#E0C7FF', '#FFD3E8', '#A9D8FF'];
        after('employer-cands', apps.slice(0, 3).map(function (a, i) {
          var sp = byId(student_profiles, a.student_id) || { user_id: 1 }, u = byId(users, sp.user_id) || { full_name: 'Ứng viên' };
          return '<div class="candidate"><span style="background:' + bg[i % 3] + '">' + initials(u.full_name) + '</span>' +
            '<div><strong>' + E(u.full_name) + '</strong><small>' + E(jobOf(a).title) + '</small></div>' +
            '<button type="button" data-view-cand="' + a.id + '">Xem hồ sơ</button></div>';
        }).join('') || '<p class="empty-note">Chưa có ứng viên nào.</p>');
      }

      /* Bảng tóm tắt việc làm ở Tab 0 */
      var rowsEl = $('employer-rows');
      if (rowsEl) {
        rowsEl.innerHTML = own.map(function (j) {
          var n = apps.filter(function (a) { return a.job_id === j.id; }).length;
          var st = JOB_STATUS[j.status] || ['Đang hoạt động', 'accepted'];
          return '<div class="table-row"><span><b>' + E(j.title) + '</b><small>' + E(HG.typeLabel(j.job_type)) + '</small></span><span>' + n + '</span><span>—</span>' +
            '<span><i class="status ' + st[1] + '">' + st[0] + '</i></span><span>' + (HG.fmtDate(j.end_date) || '—') + '</span></div>';
        }).join('') || '<div style="padding:15px; text-align:center; color:#889;">Chưa có tin tuyển dụng nào.</div>';
      }
    };
    renderEmployerOverview();

    /* TAB 1: HỒ SƠ DOANH NGHIỆP */
    var empAvatar = $('emp-avatar'), empDispName = $('emp-display-name'), empDispSub = $('emp-display-sub');
    var inCompName = $('emp-company-name'), inRepName = $('emp-rep-name'), inIndustry = $('emp-industry');
    var inPhone = $('emp-phone'), inEmail = $('emp-email'), inAddress = $('emp-address'), inDesc = $('emp-desc');

    function syncEmployerProfile() {
      if (empAvatar) empAvatar.textContent = initials(emp.company_name);
      if (empDispName) empDispName.textContent = emp.company_name;
      if (empDispSub) empDispSub.textContent = (emp.industry || 'Doanh nghiệp') + ' · ' + (emp.company_address || 'Trụ sở chính');
      if (inCompName) inCompName.value = emp.company_name || '';
      if (inRepName) inRepName.value = emp.representative_name || user.full_name || '';
      if (inIndustry) inIndustry.value = emp.industry || '';
      if (inPhone) inPhone.value = emp.company_phone || user.phone || '';
      if (inEmail) inEmail.value = user.email || '';
      if (inAddress) inAddress.value = emp.company_address || '';
      if (inDesc) inDesc.value = emp.description || '';
    }
    syncEmployerProfile();

    var empForm = $('employer-profile-form');
    if (empForm) {
      empForm.addEventListener('submit', function(e) {
        e.preventDefault();
        emp.company_name = inCompName.value.trim();
        emp.representative_name = inRepName.value.trim();
        emp.industry = inIndustry.value.trim();
        emp.company_phone = inPhone.value.trim();
        emp.company_address = inAddress.value.trim();
        emp.description = inDesc.value.trim();
        emp.updated_at = HG.now();

        HG.write('hg_emp_profile_' + user.id, emp);
        syncEmployerProfile();
        var hStrong = document.querySelector('.user-name strong');
        if (hStrong) hStrong.textContent = emp.company_name;
        showToast('Cập nhật hồ sơ doanh nghiệp thành công!');
      });
    }

    /* TAB 2: QUẢN LÝ TIN TUYỂN DỤNG */
    var fullJobsListEl = $('employer-full-jobs-list');
    var activeJobFilter = 'all';
    var jobFilterSearch = $('emp-job-search');

    function renderFullJobsList() {
      if (!fullJobsListEl) return;
      var own = getOwnJobs();
      var apps = getOwnApps();
      var q = (jobFilterSearch ? jobFilterSearch.value : '').trim().toLowerCase();

      var filtered = own.filter(function(j) {
        var matchStatus = activeJobFilter === 'all' || j.status === activeJobFilter;
        var matchQuery = !q || j.title.toLowerCase().indexOf(q) !== -1;
        return matchStatus && matchQuery;
      });

      if (!filtered.length) {
        fullJobsListEl.innerHTML = '<div style="padding: 30px; text-align:center; color:#889;">Không tìm thấy tin tuyển dụng phù hợp.</div>';
        return;
      }

      fullJobsListEl.innerHTML = filtered.map(function(j) {
        var n = apps.filter(function (a) { return a.job_id === j.id; }).length;
        var cat = byId(job_categories, j.category_id);
        var st = JOB_STATUS[j.status] || ['Đang hoạt động', 'accepted'];

        return '<div class="table-row">' +
          '<span><b>' + E(j.title) + '</b><small>Tạo ngày: ' + HG.fmtDate(j.created_at) + '</small></span>' +
          '<span>' + E(cat ? cat.name : HG.typeLabel(j.job_type)) + '</span>' +
          '<span>' + E(j.salary_text || 'Thỏa thuận') + '</span>' +
          '<span><b>' + n + '</b> đơn</span>' +
          '<span><i class="status ' + st[1] + '">' + st[0] + '</i></span>' +
          '<span class="table-actions">' +
            '<a class="cv-action-btn" href="job-detail.html?id=' + j.id + '" title="Xem chi tiết">' + I('eye', 14) + '</a>' +
            '<button type="button" class="cv-action-btn danger" data-del-own-job="' + j.id + '" title="Xóa tin">' + I('trash', 14) + '</button>' +
          '</span>' +
        '</div>';
      }).join('');
    }
    renderFullJobsList();

    var jobFilterTabs = $('emp-job-filter-tabs');
    if (jobFilterTabs) {
      jobFilterTabs.addEventListener('click', function(e) {
        var b = e.target.closest('[data-job-filter]');
        if (b) {
          jobFilterTabs.querySelectorAll('.dash-pill').forEach(function(p){ p.classList.remove('active'); });
          b.classList.add('active');
          activeJobFilter = b.dataset.jobFilter;
          renderFullJobsList();
        }
      });
    }
    if (jobFilterSearch) {
      jobFilterSearch.addEventListener('input', renderFullJobsList);
    }
    if (fullJobsListEl) {
      fullJobsListEl.addEventListener('click', function(e) {
        var delBtn = e.target.closest('[data-del-own-job]');
        if (delBtn) {
          var jid = Number(delBtn.dataset.delOwnJob);
          HG.confirm({
            title: 'Xóa tin tuyển dụng?',
            message: 'Tin tuyển dụng sẽ bị gỡ bỏ khỏi hệ thống và không thể khôi phục.',
            confirmText: 'Xóa tin',
            cancelText: 'Hủy',
            danger: true
          }).then(function(ok) {
            if (ok) {
              var idx = JOBS.findIndex(function(x){ return x.id === jid; });
              if (idx !== -1) JOBS.splice(idx, 1);
              renderEmployerOverview();
              renderFullJobsList();
              showToast('Đã xóa tin tuyển dụng thành công.');
            }
          });
        }
      });
    }

    /* TAB 3: ĐĂNG TIN TUYỂN DỤNG */
    var form = $('post-form');
    if (form) {
      var f = form.querySelectorAll('input,select,textarea');
      if (f.length >= 8) {
        f[1].innerHTML = job_categories.map(function (c) { return '<option value="' + c.id + '">' + E(c.name) + '</option>'; }).join('');
        f[2].innerHTML = '<option value="part-time">Part-time</option><option value="internship">Thực tập</option><option value="full-time">Toàn thời gian</option>';
        f[6].value = emp.company_address || '';

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var nums = (f[5].value.match(/\d+/g) || []).map(Number);
          var nextId = Math.max.apply(null, JOBS.map(function (j) { return j.id; })) + 1;
          HG.addJob({
            id: nextId,
            employer_id: emp.id,
            category_id: Number(f[1].value),
            location_id: null,
            location_text: f[6].value || emp.company_address,
            approved_by: null,
            title: f[0].value,
            description: f[3].value,
            requirements: f[4].value,
            salary_min: nums[0] || 0,
            salary_max: nums[1] || nums[0] || 0,
            salary_text: f[5].value || 'Thỏa thuận',
            job_type: f[2].value,
            work_time: f[7].value,
            quantity: 1,
            experience_level: 'Không yêu cầu',
            benefits: 'Đầy đủ đãi ngộ',
            start_date: '',
            end_date: f[8].value,
            status: 'pending',
            approved_at: null,
            rejected_reason: null,
            created_at: HG.now(),
            updated_at: HG.now()
          });

          form.hidden = true;
          var succ = $('post-success');
          if (succ) succ.hidden = false;
          renderEmployerOverview();
          renderFullJobsList();
          showToast('Đăng tin thành công! Tin đang chờ kiểm duyệt.');
        });

        var postAnotherBtn = $('post-another-btn');
        if (postAnotherBtn) {
          postAnotherBtn.addEventListener('click', function() {
            form.reset();
            f[6].value = emp.company_address || '';
            form.hidden = false;
            var succ = $('post-success');
            if (succ) succ.hidden = true;
          });
        }
      }
    }

    /* TAB 4: QUẢN LÝ ỨNG VIÊN */
    var candFullEl = $('employer-candidates-full');
    var activeCandFilter = 'all';

    function renderEmployerCandidates() {
      if (!candFullEl) return;
      var apps = getOwnApps();
      var filtered = apps.filter(function(a) {
        var sName = statusName(a.status_id);
        return activeCandFilter === 'all' || sName === activeCandFilter;
      });

      if (!filtered.length) {
        candFullEl.innerHTML = '<div style="background:#fff; border:1px solid #edf0f8; border-radius:18px; padding:40px; text-align:center;">' +
          '<span style="width:50px; height:50px; border-radius:50%; background:#eef2ff; color:#4f7dff; display:grid; place-items:center; margin:0 auto 12px;">' + I('users', 24) + '</span>' +
          '<h3>Không có ứng viên nào ở trạng thái này</h3>' +
          '<p style="color:#889; font-size:var(--fs-xs); margin-top:4px;">Khi sinh viên ứng tuyển, hồ sơ sẽ hiển thị tại đây.</p>' +
          '</div>';
        return;
      }

      candFullEl.innerHTML = filtered.map(function(a) {
        var sp = byId(student_profiles, a.student_id) || { user_id: 1, university: 'ĐH Bách Khoa', major: 'CNTT' };
        var u = byId(users, sp.user_id) || { full_name: 'Nguyễn Văn A', email: 'student@example.com', phone: '0987654321' };
        var j = jobOf(a);
        var stName = statusName(a.status_id);
        var st = STATUS[stName] || ['Đã nộp', 'pending'];

        return '<div class="candidate-card-rich">' +
          '<div class="cand-avatar-wrap">' +
            '<span class="cand-avatar-img">' + initials(u.full_name) + '</span>' +
            '<div>' +
              '<h3 style="font-size: var(--fs-body); margin-bottom: 2px;">' + E(u.full_name) + '</h3>' +
              '<p style="color: #6a748c; font-size: var(--fs-xs); margin: 0;">' +
                'Vị trí ứng tuyển: <strong>' + E(j.title) + '</strong> · ' + E(sp.university || 'Sinh viên') +
              '</p>' +
              '<small style="color: #929bae; font-size: 11px;">Nộp lúc: ' + HG.fmtDate(a.applied_at) + ' · Email: ' + E(u.email) + ' · SĐT: ' + E(u.phone) + '</small>' +
            '</div>' +
          '</div>' +
          '<div class="cand-actions-wrap">' +
            '<span class="status ' + st[1] + '">' + st[0] + '</span>' +
            '<button type="button" class="cv-action-btn" data-view-cand="' + a.id + '" title="Xem chi tiết">' + I('eye', 14) + ' Xem CV</button>' +
            '<button type="button" class="cv-action-btn" data-interview-cand="' + a.id + '" title="Mời phỏng vấn">' + I('calendar', 14) + ' Mời PV</button>' +
            '<button type="button" class="cv-action-btn" style="color:#2ba788;" data-accept-cand="' + a.id + '" title="Nhận việc">' + I('check', 14) + ' Nhận</button>' +
            '<button type="button" class="cv-action-btn danger" data-reject-cand="' + a.id + '" title="Từ chối">' + I('x', 14) + '</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }
    renderEmployerCandidates();

    function openCandidateModal(aid) {
      var a = HG.applications().filter(function(x){ return x.id === aid; })[0];
      if (!a) return;
      var sp = byId(student_profiles, a.student_id) || { user_id: 1, university: 'ĐH Bách Khoa', major: 'CNTT', bio: '' };
      var u = byId(users, sp.user_id) || { full_name: 'Nguyễn Văn A', email: 'student@example.com', phone: '0987654321' };
      var j = jobOf(a);
      var stName = statusName(a.status_id);
      var st = STATUS[stName] || ['Đã nộp', 'pending'];

      HG.modal.open({
        className: 'modal-candidate-detail',
        html: '<div style="padding: 10px;">' +
          '<div style="display:flex; align-items:center; gap:16px; margin-bottom:18px;">' +
            '<span class="cand-avatar-img" style="width:56px; height:56px; font-size:20px;">' + initials(u.full_name) + '</span>' +
            '<div>' +
              '<h2 style="font-size: var(--fs-h4); margin:0 0 4px;">' + E(u.full_name) + '</h2>' +
              '<p style="color:#717b94; font-size:var(--fs-xs); margin:0;">Ứng tuyển: <strong>' + E(j.title) + '</strong></p>' +
            '</div>' +
          '</div>' +
          '<div style="background:#f8f9fe; border:1px solid #e2e6f4; border-radius:14px; padding:18px; margin-bottom:18px; font-size:var(--fs-body-sm); line-height:1.7;">' +
            '<div><strong>Trường đại học:</strong> ' + E(sp.university || 'Chưa cập nhật') + '</div>' +
            '<div><strong>Chuyên ngành:</strong> ' + E(sp.major || 'Chưa cập nhật') + '</div>' +
            '<div><strong>Email liên hệ:</strong> ' + E(u.email) + '</div>' +
            '<div><strong>Số điện thoại:</strong> ' + E(u.phone) + '</div>' +
            '<div><strong>Ngày nộp hồ sơ:</strong> ' + HG.fmtDate(a.applied_at) + '</div>' +
            '<div style="margin-top:10px;"><strong>Lời nhắn từ sinh viên:</strong><br><em style="color:#505c78;">"' + E(a.cover_letter || 'Tôi rất mong muốn được thử sức và đóng góp tại công ty.') + '"</em></div>' +
          '</div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">' +
            '<span>Trạng thái: <i class="status ' + st[1] + '">' + st[0] + '</i></span>' +
            '<div style="display:flex; gap:8px;">' +
              '<button type="button" class="primary-btn small" data-modal-interview="' + a.id + '">Mời phỏng vấn</button>' +
              '<button type="button" class="secondary-btn small" data-close>Đóng</button>' +
            '</div>' +
          '</div>' +
        '</div>',
        onMount: function(api) {
          var btn = api.box.querySelector('[data-modal-interview]');
          if (btn) {
            btn.addEventListener('click', function() {
              a.status_id = 3; /* interview */
              renderEmployerOverview();
              renderEmployerCandidates();
              showToast('Đã gửi thông báo mời phỏng vấn!');
              api.close();
            });
          }
        }
      });
    }

    document.addEventListener('click', function(e) {
      var vBtn = e.target.closest('[data-view-cand]');
      if (vBtn) {
        var aid = Number(vBtn.dataset.viewCand);
        openCandidateModal(aid);
      }
    });

    var candFilterTabs = $('cand-filter-tabs');
    if (candFilterTabs) {
      candFilterTabs.addEventListener('click', function(e) {
        var b = e.target.closest('[data-cand-filter]');
        if (b) {
          candFilterTabs.querySelectorAll('.dash-pill').forEach(function(p){ p.classList.remove('active'); });
          b.classList.add('active');
          activeCandFilter = b.dataset.candFilter;
          renderEmployerCandidates();
        }
      });
    }

    if (candFullEl) {
      candFullEl.addEventListener('click', function(e) {
        var intBtn = e.target.closest('[data-interview-cand]');
        if (intBtn) {
          var aid = Number(intBtn.dataset.interviewCand);
          var target = HG.applications().filter(function(x){ return x.id === aid; })[0];
          if (target) {
            target.status_id = 3; /* interview */
            showToast('Đã gửi thông báo mời phỏng vấn tới sinh viên!');
            renderEmployerOverview();
            renderEmployerCandidates();
          }
          return;
        }

        var accBtn = e.target.closest('[data-accept-cand]');
        if (accBtn) {
          var aid = Number(accBtn.dataset.acceptCand);
          var target = HG.applications().filter(function(x){ return x.id === aid; })[0];
          if (target) {
            target.status_id = 4; /* accepted */
            showToast('Đã chuyển trạng thái: Ứng viên trúng tuyển!');
            renderEmployerOverview();
            renderEmployerCandidates();
          }
          return;
        }

        var rejBtn = e.target.closest('[data-reject-cand]');
        if (rejBtn) {
          var aid = Number(rejBtn.dataset.rejectCand);
          var target = HG.applications().filter(function(x){ return x.id === aid; })[0];
          if (target) {
            target.status_id = 5; /* rejected */
            showToast('Đã từ chối đơn ứng tuyển.');
            renderEmployerOverview();
            renderEmployerCandidates();
          }
          return;
        }
      });
    }

    /* TAB 5: CÀI ĐẶT */
    var empPw = $('emp-pw-form'), empPref = $('emp-pref-form');
    if (empPw) {
      empPw.addEventListener('submit', function(e) {
        e.preventDefault();
        showToast('Đã đổi mật khẩu tài khoản tuyển dụng thành công!');
        empPw.reset();
      });
    }
    if (empPref) {
      empPref.addEventListener('submit', function(e) {
        e.preventDefault();
        showToast('Đã lưu tùy chọn thông báo tuyển dụng!');
      });
    }
  }

  /* =========================================================
     3. QUẢN TRỊ VIÊN (ADMIN)
     ========================================================= */
  if (role === 'admin') {
    var count = function (r) { return users.filter(function (u) { return u.role === r; }).length; };
    var updateAdminStats = function() {
      setStat('users', users.length, 'Toàn hệ thống');
      setStat('students', count('student'), 'Tài khoản sinh viên');
      setStat('employers', count('employer'), 'Tài khoản nhà tuyển dụng');
      setStat('jobs', JOBS.length, 'Tổng số tin');
      var repStat = $('stat-report-count');
      if (repStat) repStat.textContent = reports.filter(function(r){ return r.status === 'pending'; }).length;
    };
    updateAdminStats();

    /* Báo cáo gần đây ở Tab 0 */
    var secAct = $('admin-activity');
    if (secAct) {
      secAct.querySelectorAll('div:not(.panel-title)').forEach(function(el){ el.remove(); });
      var RTYPE = { job: 'tin tuyển dụng', employer: 'nhà tuyển dụng', student: 'sinh viên' };
      after('admin-activity', reports.map(function (r) {
        return '<div><span>' + I('shield') + '</span><p><strong>Báo cáo ' + (RTYPE[r.report_type] || r.report_type) + ' #' + r.target_id + '</strong><small>' +
          E(r.reason) + ' · ' + (r.status === 'resolved' ? 'Đã xử lý' : 'Chờ xử lý') + '</small></p></div>';
      }).join(''));
    }

    /* TAB 0 & 5: KIỂM DUYỆT TIN ĐĂNG */
    var mod = $('moderation-rows'), pending = $('pending-count');
    var fullModEl = $('admin-full-mod-rows');
    var activeModFilter = 'pending';
    var MOD = { pending: ['Chờ duyệt', 'pending'], approved: ['Đã duyệt', 'accepted'], rejected: ['Từ chối', ''] };

    var drawModeration = function () {
      var order = { pending: 0, approved: 1, rejected: 2 };
      var sorted = JOBS.slice().sort(function (a, b) { return order[a.status] - order[b.status] || b.id - a.id; });

      if (mod) {
        mod.innerHTML = sorted.slice(0, 5).map(function (j) {
          var c = companyOf(j), cat = byId(job_categories, j.category_id), st = MOD[j.status] || ['Chờ duyệt', 'pending'];
          return '<div class="table-row"><span class="company-cell"><i class="company-logo" style="background:' + HG.employerColor(c.id) + '">' + E(c.company_name.charAt(0)) + '</i>' +
            '<span><b>' + E(j.title) + '</b><small>' + E(c.company_name) + '</small></span></span>' +
            '<span>' + HG.fmtDate(j.created_at) + '</span><span>' + E(cat ? cat.name : '') + '</span>' +
            '<span><i class="status ' + st[1] + '">' + st[0] + '</i></span>' +
            '<span class="table-actions"><button data-act="rejected" data-id="' + j.id + '" title="Từ chối">' + I('x', 17) + '</button>' +
            '<button class="approve" data-act="approved" data-id="' + j.id + '" title="Duyệt">' + I('check', 17) + '</button></span></div>';
        }).join('');
      }

      var pendCount = JOBS.filter(function (j) { return j.status === 'pending'; }).length;
      if (pending) pending.textContent = pendCount + ' tin đang chờ';

      if (fullModEl) {
        var filteredMod = sorted.filter(function(j) {
          return activeModFilter === 'all' || j.status === activeModFilter;
        });

        if (!filteredMod.length) {
          fullModEl.innerHTML = '<div style="padding: 24px; text-align:center; color:#889;">Không có tin tuyển dụng nào trong danh sách này.</div>';
        } else {
          fullModEl.innerHTML = filteredMod.map(function (j) {
            var c = companyOf(j), cat = byId(job_categories, j.category_id), st = MOD[j.status] || ['Chờ duyệt', 'pending'];
            return '<div class="table-row"><span class="company-cell"><i class="company-logo" style="background:' + HG.employerColor(c.id) + '">' + E(c.company_name.charAt(0)) + '</i>' +
              '<span><b>' + E(j.title) + '</b><small>' + E(c.company_name) + '</small></span></span>' +
              '<span>' + HG.fmtDate(j.created_at) + '</span><span>' + E(cat ? cat.name : '') + '</span>' +
              '<span>' + E(j.salary_text || 'Thỏa thuận') + '</span>' +
              '<span><i class="status ' + st[1] + '">' + st[0] + '</i></span>' +
              '<span class="table-actions">' +
                '<button class="approve" data-act="approved" data-id="' + j.id + '" title="Phê duyệt">' + I('check', 16) + ' Duyệt</button>' +
                '<button class="cv-action-btn danger" data-act="rejected" data-id="' + j.id + '" title="Từ chối">' + I('x', 16) + ' Từ chối</button>' +
              '</span></div>';
          }).join('');
        }
      }
    };

    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var jid = Number(b.dataset.id), act = b.dataset.act;
      HG.setJobStatus(jid, act);
      drawModeration();
      renderAdminAllJobs();
      updateAdminStats();
      showToast(act === 'approved' ? 'Đã phê duyệt tin tuyển dụng #' + jid : 'Đã từ chối tin tuyển dụng #' + jid);
    });

    var modFilterTabs = $('admin-mod-filter-tabs');
    if (modFilterTabs) {
      modFilterTabs.addEventListener('click', function(e) {
        var b = e.target.closest('[data-mod-filter]');
        if (b) {
          modFilterTabs.querySelectorAll('.dash-pill').forEach(function(p){ p.classList.remove('active'); });
          b.classList.add('active');
          activeModFilter = b.dataset.modFilter;
          drawModeration();
        }
      });
    }
    drawModeration();

    /* TAB 1: QUẢN LÝ SINH VIÊN */
    var stuTableEl = $('admin-students-table');
    var stuSearch = $('admin-student-search');

    function renderAdminStudents() {
      if (!stuTableEl) return;
      var q = (stuSearch ? stuSearch.value : '').trim().toLowerCase();
      var stus = users.filter(function(u) { return u.role === 'student'; });

      var filtered = stus.filter(function(u) {
        var p = student_profiles.filter(function(x){ return x.user_id === u.id; })[0] || {};
        return !q || u.full_name.toLowerCase().indexOf(q) !== -1 ||
          u.email.toLowerCase().indexOf(q) !== -1 ||
          (p.university || '').toLowerCase().indexOf(q) !== -1;
      });

      if (!filtered.length) {
        stuTableEl.innerHTML = '<div style="padding: 24px; text-align: center; color: #889;">Không tìm thấy sinh viên nào.</div>';
        return;
      }

      stuTableEl.innerHTML = filtered.map(function(u) {
        var p = student_profiles.filter(function(x){ return x.user_id === u.id; })[0] || {};
        var isActive = u.status === 'active';
        return '<div class="table-row">' +
          '<span><b>' + E(u.full_name) + '</b><small>Mã SV: #' + u.id + '</small></span>' +
          '<span>' + E(u.email) + '<br><small>' + E(u.phone) + '</small></span>' +
          '<span>' + E(p.university || 'Chưa cập nhật') + '<br><small>' + E(p.major || 'Chưa cập nhật') + '</small></span>' +
          '<span>' + HG.fmtDate(u.created_at) + '</span>' +
          '<span><i class="' + (isActive ? 'admin-badge-active' : 'admin-badge-locked') + '">' + (isActive ? 'Hoạt động' : 'Đang khóa') + '</i></span>' +
          '<span class="table-actions">' +
            '<button type="button" class="cv-action-btn' + (isActive ? ' danger' : '') + '" data-toggle-user="' + u.id + '">' +
              (isActive ? 'Khóa' : 'Mở khóa') +
            '</button>' +
          '</span>' +
        '</div>';
      }).join('');
    }
    renderAdminStudents();
    if (stuSearch) stuSearch.addEventListener('input', renderAdminStudents);

    /* TAB 2: QUẢN LÝ NHÀ TUYỂN DỤNG */
    var empTableEl = $('admin-employers-table');
    var empSearch = $('admin-employer-search');

    function renderAdminEmployers() {
      if (!empTableEl) return;
      var q = (empSearch ? empSearch.value : '').trim().toLowerCase();
      var emps = users.filter(function(u) { return u.role === 'employer'; });

      var filtered = emps.filter(function(u) {
        var ep = employer_profiles.filter(function(x){ return x.user_id === u.id; })[0] || {};
        return !q || (ep.company_name || '').toLowerCase().indexOf(q) !== -1 ||
          u.full_name.toLowerCase().indexOf(q) !== -1;
      });

      if (!filtered.length) {
        empTableEl.innerHTML = '<div style="padding: 24px; text-align: center; color: #889;">Không tìm thấy nhà tuyển dụng nào.</div>';
        return;
      }

      empTableEl.innerHTML = filtered.map(function(u) {
        var ep = employer_profiles.filter(function(x){ return x.user_id === u.id; })[0] || {};
        var jCount = JOBS.filter(function(j){ return j.employer_id === ep.id; }).length;
        var isVer = ep.verified;
        return '<div class="table-row">' +
          '<span class="company-cell"><i class="company-logo" style="background:#5B7CFA">' + E((ep.company_name || 'C').charAt(0)) + '</i>' +
            '<span><b>' + E(ep.company_name || 'Doanh nghiệp') + '</b><small>' + E(ep.company_address || 'Hà Nội') + '</small></span></span>' +
          '<span>' + E(ep.representative_name || u.full_name) + '</span>' +
          '<span>' + E(ep.industry || 'Bán lẻ') + '<br><small>' + E(u.email) + '</small></span>' +
          '<span><b>' + jCount + '</b> tin</span>' +
          '<span><i class="' + (isVer ? 'admin-badge-active' : 'admin-badge-locked') + '">' + (isVer ? 'Đã xác minh' : 'Chưa xác minh') + '</i></span>' +
          '<span class="table-actions">' +
            '<button type="button" class="cv-action-btn" data-verify-emp="' + ep.id + '">' + (isVer ? 'Hủy duyệt' : 'Xác minh') + '</button>' +
          '</span>' +
        '</div>';
      }).join('');
    }
    renderAdminEmployers();
    if (empSearch) empSearch.addEventListener('input', renderAdminEmployers);

    /* Event delegation for admin tables */
    document.addEventListener('click', function(e) {
      var uBtn = e.target.closest('[data-toggle-user]');
      if (uBtn) {
        var uid = Number(uBtn.dataset.toggleUser);
        var targetUser = byId(users, uid);
        if (targetUser) {
          targetUser.status = (targetUser.status === 'active' ? 'blocked' : 'active');
          renderAdminStudents();
          showToast('Đã cập nhật trạng thái tài khoản #' + uid);
        }
        return;
      }

      var vBtn = e.target.closest('[data-verify-emp]');
      if (vBtn) {
        var epid = Number(vBtn.dataset.verifyEmp);
        var targetEmp = byId(employer_profiles, epid);
        if (targetEmp) {
          targetEmp.verified = !targetEmp.verified;
          renderAdminEmployers();
          showToast('Đã cập nhật trạng thái xác thực doanh nghiệp!');
        }
        return;
      }
    });

    /* TAB 3: QUẢN LÝ VIỆC LÀM */
    var ajTableEl = $('admin-all-jobs-table');
    var ajSearch = $('admin-job-search');
    var activeAjFilter = 'all';

    function renderAdminAllJobs() {
      if (!ajTableEl) return;
      var q = (ajSearch ? ajSearch.value : '').trim().toLowerCase();
      var filtered = JOBS.filter(function(j) {
        var c = companyOf(j);
        var matchStatus = activeAjFilter === 'all' || j.status === activeAjFilter;
        var matchQuery = !q || j.title.toLowerCase().indexOf(q) !== -1 || c.company_name.toLowerCase().indexOf(q) !== -1;
        return matchStatus && matchQuery;
      });

      if (!filtered.length) {
        ajTableEl.innerHTML = '<div style="padding: 24px; text-align: center; color: #889;">Không tìm thấy tin tuyển dụng nào.</div>';
        return;
      }

      ajTableEl.innerHTML = filtered.map(function(j) {
        var c = companyOf(j), cat = byId(job_categories, j.category_id), st = MOD[j.status] || ['Chờ duyệt', 'pending'];
        return '<div class="table-row">' +
          '<span><b>' + E(j.title) + '</b><small>Mã tin: #' + j.id + ' · ' + HG.typeLabel(j.job_type) + '</small></span>' +
          '<span>' + E(c.company_name) + '</span>' +
          '<span>' + E(cat ? cat.name : '') + '</span>' +
          '<span>' + E(j.salary_text || 'Thỏa thuận') + '</span>' +
          '<span><i class="status ' + st[1] + '">' + st[0] + '</i></span>' +
          '<span class="table-actions">' +
            '<a class="cv-action-btn" href="job-detail.html?id=' + j.id + '" title="Xem">' + I('eye', 14) + '</a>' +
            '<button type="button" class="cv-action-btn danger" data-del-admin-job="' + j.id + '" title="Xóa">' + I('trash', 14) + '</button>' +
          '</span>' +
        '</div>';
      }).join('');
    }
    renderAdminAllJobs();

    if (ajSearch) ajSearch.addEventListener('input', renderAdminAllJobs);
    var ajFilterTabs = $('admin-jobs-filter-tabs');
    if (ajFilterTabs) {
      ajFilterTabs.addEventListener('click', function(e) {
        var b = e.target.closest('[data-aj-filter]');
        if (b) {
          ajFilterTabs.querySelectorAll('.dash-pill').forEach(function(p){ p.classList.remove('active'); });
          b.classList.add('active');
          activeAjFilter = b.dataset.ajFilter;
          renderAdminAllJobs();
        }
      });
    }

    if (ajTableEl) {
      ajTableEl.addEventListener('click', function(e) {
        var delBtn = e.target.closest('[data-del-admin-job]');
        if (delBtn) {
          var jid = Number(delBtn.dataset.delAdminJob);
          HG.confirm({
            title: 'Xóa bài đăng tuyển dụng?',
            message: 'Bài đăng #' + jid + ' sẽ bị xóa khỏi toàn hệ thống.',
            confirmText: 'Xác nhận xóa',
            cancelText: 'Hủy bỏ',
            danger: true
          }).then(function(ok) {
            if (ok) {
              var idx = JOBS.findIndex(function(x){ return x.id === jid; });
              if (idx !== -1) JOBS.splice(idx, 1);
              renderAdminAllJobs();
              drawModeration();
              updateAdminStats();
              showToast('Đã xóa bài đăng #' + jid);
            }
          });
        }
      });
    }

    /* TAB 4: BÁO CÁO VI PHẠM */
    var repTableEl = $('admin-reports-table');
    function renderAdminReports() {
      if (!repTableEl) return;
      var RTYPE = { job: 'Tin tuyển dụng', employer: 'Doanh nghiệp', student: 'Sinh viên' };
      repTableEl.innerHTML = reports.map(function(r) {
        var isRes = r.status === 'resolved';
        return '<div class="table-row">' +
          '<span><b>' + (RTYPE[r.report_type] || r.report_type) + '</b><small>Mã #' + r.target_id + '</small></span>' +
          '<span>' + E(r.reason) + '</span>' +
          '<span>Đối tượng #' + r.target_id + '</span>' +
          '<span>' + HG.fmtDate(r.created_at) + '</span>' +
          '<span><i class="' + (isRes ? 'admin-badge-active' : 'admin-badge-locked') + '">' + (isRes ? 'Đã giải quyết' : 'Chờ xử lý') + '</i></span>' +
          '<span class="table-actions">' +
            (!isRes ? '<button type="button" class="cv-action-btn" data-resolve-rep="' + r.id + '">' + I('check', 14) + ' Xử lý</button>' : '<span style="color:#2ba788; font-size:12px;">Xong</span>') +
          '</span>' +
        '</div>';
      }).join('');
    }
    renderAdminReports();

    if (repTableEl) {
      repTableEl.addEventListener('click', function(e) {
        var rBtn = e.target.closest('[data-resolve-rep]');
        if (rBtn) {
          var rid = Number(rBtn.dataset.resolveRep);
          var targetRep = byId(reports, rid);
          if (targetRep) {
            targetRep.status = 'resolved';
            targetRep.admin_note = 'Quản trị viên đã xử lý phản ánh.';
            renderAdminReports();
            updateAdminStats();
            showToast('Đã xử lý xong báo cáo #' + rid);
          }
        }
      });
    }
  }
})();
