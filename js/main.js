/* Tiện ích dùng chung: icon, đăng nhập (session), việc đã lưu, ứng tuyển, thẻ việc làm, header */
(function () {
  'use strict';
  var HG = (window.HG = {});
  var memUid = null, savedMem = {}, appsMem = null;

  function read(k, def) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  HG.read = read; HG.write = write;

  /* ---- Tài khoản đăng ký mới: lưu localStorage, nạp lại vào mock-data mỗi lần mở trang ---- */
  read('hg_new_accounts', []).forEach(function (a) {
    users.push(a.user);
    (a.user.role === 'student' ? student_profiles : employer_profiles).push(a.profile);
  });

  HG.icon = function (name, size) {
    size = size || 20;
    return '<svg class="icon" width="' + size + '" height="' + size + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  };
  HG.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  HG.fmtDate = function (s) { return s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : ''; };

  /* ---- Đăng nhập (so khớp với bảng users trong mock-data.js) ---- */
  HG.dashUrl = { student: 'student.html', employer: 'employer.html', admin: 'admin.html' };
  HG.user = function () {
    var id = read('hg_session', null) || memUid;
    return id ? users.find(function (u) { return u.id === id; }) || null : null;
  };
  var ROLE_NAME = { student: 'Ứng viên / Sinh viên', employer: 'Nhà tuyển dụng', admin: 'Quản trị viên' };
  HG.roleName = ROLE_NAME;
  /* role (tuỳ chọn): vai trò người dùng chọn trên form; tài khoản phải đúng vai trò đó */
  HG.login = function (email, password, role) {
    var u = users.find(function (x) { return x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password; });
    if (!u) return { error: 'Email hoặc mật khẩu không đúng.' };
    if (u.status !== 'active') return { error: 'Tài khoản đang bị khóa.' };
    if (role && u.role !== role) return { error: 'Đây là tài khoản ' + ROLE_NAME[u.role] + '. Hãy chọn đúng loại tài khoản ở trên.' };
    memUid = u.id; write('hg_session', u.id);
    return { user: u };
  };
  HG.emailExists = function (email) {
    return users.some(function (x) { return x.email.toLowerCase() === email.trim().toLowerCase(); });
  };
  /* Đăng ký: d = { role, full_name, email, phone, password, university?, company_name? } (demo – không mã hoá mật khẩu) */
  HG.register = function (d) {
    if (HG.emailExists(d.email)) return { error: 'Email này đã được đăng ký.' };
    var now = HG.now ? HG.now() : new Date().toISOString().slice(0, 19).replace('T', ' ');
    var nextId = function (list) { return list.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1; };
    var user = { id: nextId(users), email: d.email.trim(), password: d.password, full_name: d.full_name.trim(), phone: d.phone.trim(),
      role: d.role, status: 'active', created_at: now, updated_at: now };
    var profile = d.role === 'student'
      ? { id: nextId(student_profiles), user_id: user.id, university: d.university || '', major: '', bio: '', address: '', date_of_birth: null, avatar_url: '', created_at: now, updated_at: now }
      : { id: nextId(employer_profiles), user_id: user.id, company_name: d.company_name, representative_name: user.full_name, company_address: '', company_phone: user.phone,
          industry: '', description: '', logo_url: '', verified: false, created_at: now, updated_at: now };
    var list = read('hg_new_accounts', []); list.push({ user: user, profile: profile }); write('hg_new_accounts', list);
    users.push(user); (d.role === 'student' ? student_profiles : employer_profiles).push(profile);
    memUid = user.id; write('hg_session', user.id);           // đăng ký xong tự đăng nhập
    return { user: user };
  };
  /* Chuyển tới trang đăng nhập/đăng ký: o = { mode:'signin|signup', role, next, notice } */
  HG.goAuth = function (o) {
    o = o || {};
    var q = [];
    ['mode', 'role', 'next', 'notice'].forEach(function (k) { if (o[k]) q.push(k + '=' + encodeURIComponent(o[k])); });
    location.href = 'auth.html' + (q.length ? '?' + q.join('&') : '');
  };
  HG.logout = function () {
    memUid = null;
    try { localStorage.removeItem('hg_session'); } catch (e) {}
    location.href = 'index.html';
  };
  /* id trong student_profiles / employer_profiles của user đang đăng nhập */
  HG.studentId = function (u) { var p = student_profiles.find(function (x) { return x.user_id === u.id; }); return p ? p.id : null; };
  HG.employerId = function (u) { var p = employer_profiles.find(function (x) { return x.user_id === u.id; }); return p ? p.id : null; };

  /* ---- Việc đã lưu (mỗi tài khoản một danh sách, khởi tạo từ job_saves) ---- */
  function savedKey() { var u = HG.user(); return 'hg_saved_' + (u ? u.id : 0); }
  HG.getSaved = function () {
    var k = savedKey();
    if (savedMem[k]) return savedMem[k];
    var v = read(k, null);
    if (!Array.isArray(v)) {
      var u = HG.user(), sid = u && u.role === 'student' ? HG.studentId(u) : null;
      v = job_saves.filter(function (s) { return s.student_id === sid; }).map(function (s) { return s.job_id; });
    }
    return (savedMem[k] = v);
  };
  HG.isSaved = function (id) { return HG.getSaved().indexOf(id) !== -1; };
  HG.toggleSaved = function (id) {
    var s = HG.getSaved(), k = savedKey();
    savedMem[k] = s.indexOf(id) !== -1 ? s.filter(function (x) { return x !== id; }) : s.concat(id);
    write(k, savedMem[k]);
    return HG.isSaved(id);
  };

  /* ---- Đơn ứng tuyển (mock + đơn mới tạo khi test) ---- */
  HG.applications = function () { return applications.concat(read('hg_apps', [])); };
  HG.apply = function (jobId, cvId) {
    var u = HG.user();
    if (!u || u.role !== 'student') return { error: 'Cần đăng nhập tài khoản sinh viên.' };
    var sid = HG.studentId(u);
    if (HG.applications().some(function (a) { return a.student_id === sid && a.job_id === jobId; })) return { error: 'Bạn đã ứng tuyển việc này rồi.' };
    var list = read('hg_apps', []);
    list.push({ id: 1000 + list.length + 1, student_id: sid, job_id: jobId, cv_id: cvId || null, status_id: 1, cover_letter: '', applied_at: HG.now(), reviewed_at: null, created_at: HG.now(), updated_at: HG.now() });
    write('hg_apps', list);
    return { ok: true };
  };

  /* ---- Thẻ việc làm ---- */
  HG.jobCard = function (job) {
    var tags = job.tags.map(function (t, i) { return '<span' + (i ? ' class="pink-tag"' : '') + '>' + HG.esc(t) + '</span>'; }).join('');
    return '<article class="job-card" data-id="' + job.id + '" data-href="job-detail.html?id=' + job.id + '">' +
      '<div class="job-top"><span class="company-logo" style="background:' + job.color + '">' + HG.esc(job.logo) + '</span>' +
      '<button type="button" class="save-btn' + (HG.isSaved(job.id) ? ' saved' : '') + '" aria-label="Lưu việc làm">' + HG.icon('bookmark', 19) + '</button></div>' +
      '<div class="job-tags">' + tags + '</div>' +
      '<h3>' + HG.esc(job.title) + '</h3><p class="company-name">' + HG.esc(job.company) + '</p>' +
      '<div class="job-meta"><span>' + HG.icon('pin', 16) + HG.esc(job.location) + '</span><span>' + HG.icon('clock', 16) + HG.esc(job.type) + '</span></div>' +
      '<div class="job-bottom"><strong>' + HG.esc(job.salary) + '</strong><button type="button">Xem chi tiết ' + HG.icon('arrow', 16) + '</button></div></article>';
  };
  HG.renderJobs = function (el, list) { el.innerHTML = list.map(HG.jobCard).join(''); };

  document.addEventListener('click', function (e) {
    if (e.target.closest('#logout-btn, [data-logout]')) { HG.requestLogout ? HG.requestLogout() : HG.logout(); return; }
    var save = e.target.closest('.job-card .save-btn');
    if (save) {
      e.stopPropagation();
      save.classList.toggle('saved', HG.toggleSaved(Number(save.closest('.job-card').dataset.id)));
      return;
    }
    var card = e.target.closest('.job-card[data-href]');
    if (card) location.href = card.dataset.href;
  });

  /* ---- Tự động kích hoạt class .active trên menu tương ứng với trang hiện tại ---- */
  var pagePath = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.header-inner nav a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href) {
      var targetPath = href.split('#')[0];
      if (targetPath === pagePath || (pagePath === '' && targetPath === 'index.html')) {
        a.classList.add('active');
      } else if (!href.startsWith('#')) {
        a.classList.remove('active');
      }
    }
  });

  /* ---- Header: đã đăng nhập thì hiện Avatar, Menu thả xuống & Thông báo ---- */
  function getInitials(name) {
    if (!name) return 'U';
    var p = name.trim().split(/\s+/);
    return (p[0].charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : '')).toUpperCase();
  }

  var actions = document.getElementById('header-actions'), me = HG.user();
  if (actions && me) {
    var roleLabel = { student: 'Sinh viên', employer: 'Nhà tuyển dụng', admin: 'Quản trị viên' }[me.role] || me.role;
    var userInitial = getInitials(me.full_name);
    var dashUrl = HG.dashUrl[me.role];

    var roleLinks = {
      student: [
        { label: 'Tổng quan không gian', href: dashUrl + '?tab=0', icon: 'home' },
        { label: 'Hồ sơ cá nhân', href: dashUrl + '?tab=1', icon: 'user' },
        { label: 'CV của tôi', href: dashUrl + '?tab=2', icon: 'file' },
        { label: 'Việc làm yêu thích', href: dashUrl + '?tab=3', icon: 'bookmark' },
        { label: 'Đơn ứng tuyển của tôi', href: dashUrl + '?tab=4', icon: 'briefcase' },
        { label: 'Lịch làm việc & Lịch rảnh', href: dashUrl + '?tab=5', icon: 'calendar' },
        { label: 'Cài đặt tài khoản', href: dashUrl + '?tab=6', icon: 'settings' }
      ],
      employer: [
        { label: 'Tổng quan tuyển dụng', href: dashUrl + '?tab=0', icon: 'home' },
        { label: 'Hồ sơ doanh nghiệp', href: dashUrl + '?tab=1', icon: 'building' },
        { label: 'Quản lý tin tuyển dụng', href: dashUrl + '?tab=2', icon: 'file' },
        { label: 'Đăng tin tuyển dụng mới', href: dashUrl + '?tab=3', icon: 'plus' },
        { label: 'Quản lý ứng viên', href: dashUrl + '?tab=4', icon: 'users' },
        { label: 'Cài đặt tài khoản', href: dashUrl + '?tab=5', icon: 'settings' }
      ],
      admin: [
        { label: 'Tổng quan hệ thống', href: dashUrl + '?tab=0', icon: 'home' },
        { label: 'Quản lý sinh viên', href: dashUrl + '?tab=1', icon: 'users' },
        { label: 'Quản lý nhà tuyển dụng', href: dashUrl + '?tab=2', icon: 'briefcase' },
        { label: 'Quản lý việc làm', href: dashUrl + '?tab=3', icon: 'file' },
        { label: 'Thống kê & báo cáo', href: dashUrl + '?tab=4', icon: 'chart' },
        { label: 'Kiểm duyệt tin đăng', href: dashUrl + '?tab=5', icon: 'shield' }
      ]
    }[me.role] || [];

    var notifications = {
      student: [
        { title: 'Lumos Studio đã xem hồ sơ của bạn', time: '10 phút trước', unread: true, icon: 'file' },
        { title: 'Highlands Coffee tuyển 5 nhân viên phục vụ mới', time: '2 giờ trước', unread: true, icon: 'briefcase' },
        { title: 'Lịch làm việc sắp tới: Ca làm việc tại Highlands', time: 'Hôm nay 17:00', unread: false, icon: 'calendar' }
      ],
      employer: [
        { title: 'Có 2 ứng viên mới vừa nộp đơn ứng tuyển', time: '15 phút trước', unread: true, icon: 'users' },
        { title: 'Tin tuyển dụng "Nhân viên pha chế" đã được duyệt', time: '1 giờ trước', unread: true, icon: 'check' },
        { title: 'Báo cáo hiệu quả tuần: 24 lượt xem mới', time: 'Hôm qua', unread: false, icon: 'chart' }
      ],
      admin: [
        { title: 'Có 1 tin tuyển dụng mới đang chờ bạn kiểm duyệt', time: '5 phút trước', unread: true, icon: 'shield' },
        { title: '1 báo cáo mới cần xử lý từ sinh viên', time: '30 phút trước', unread: true, icon: 'alert' },
        { title: '12 tài khoản mới đăng ký thành công', time: 'Hôm nay', unread: false, icon: 'users' }
      ]
    }[me.role] || [];

    var notifyItemsHtml = notifications.map(function (n) {
      return '<div class="notify-item' + (n.unread ? ' unread' : '') + '">' +
        '<span class="notify-item-icon">' + HG.icon(n.icon, 16) + '</span>' +
        '<div class="notify-item-content"><strong>' + HG.esc(n.title) + '</strong><small>' + HG.esc(n.time) + '</small></div>' +
        '</div>';
    }).join('');

    var linksHtml = roleLinks.map(function (l) {
      return '<a class="dropdown-menu-item" href="' + l.href + '">' + HG.icon(l.icon, 16) + ' ' + HG.esc(l.label) + '</a>';
    }).join('');

    actions.innerHTML =
      '<div class="header-user-wrapper">' +
        '<button class="header-notify-btn" id="header-notify-btn" type="button" aria-label="Thông báo">' +
          HG.icon('bell', 18) +
          '<span class="badge-dot" id="header-badge-dot"></span>' +
        '</button>' +
        '<div class="header-notify-popover" id="header-notify-popover">' +
          '<div class="notify-popover-head"><strong>Thông báo (' + notifications.filter(function(x){return x.unread;}).length + ')</strong><button type="button" id="mark-read-btn">Đã đọc tất cả</button></div>' +
          '<div class="notify-popover-list">' + notifyItemsHtml + '</div>' +
        '</div>' +

        '<button class="header-user-btn" id="header-user-btn" type="button">' +
          '<span class="header-user-avatar">' + HG.esc(userInitial) + '</span>' +
          '<span>' + HG.esc(me.full_name) + '</span>' +
          '<span class="header-user-role-badge">' + HG.esc(roleLabel) + '</span>' +
          HG.icon('chevron', 14) +
        '</button>' +
        '<div class="header-dropdown-menu" id="header-dropdown-menu">' +
          '<div class="dropdown-user-head">' +
            '<strong>' + HG.esc(me.full_name) + '</strong>' +
            '<small>' + HG.esc(me.email) + ' · ' + HG.esc(roleLabel) + '</small>' +
          '</div>' +
          '<div class="dropdown-menu-list">' +
            linksHtml +
            '<button class="dropdown-menu-item logout-item" id="logout-btn" type="button">' + HG.icon('logout', 16) + ' Đăng xuất</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var userBtn = document.getElementById('header-user-btn');
    var userDropdown = document.getElementById('header-dropdown-menu');
    var notifyBtn = document.getElementById('header-notify-btn');
    var notifyPopover = document.getElementById('header-notify-popover');

    if (userBtn && userDropdown) {
      userBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (notifyPopover) notifyPopover.classList.remove('show');
        userDropdown.classList.toggle('show');
      });
    }

    if (notifyBtn && notifyPopover) {
      notifyBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (userDropdown) userDropdown.classList.remove('show');
        notifyPopover.classList.toggle('show');
      });
      var markRead = document.getElementById('mark-read-btn');
      if (markRead) {
        markRead.addEventListener('click', function (e) {
          e.stopPropagation();
          notifyPopover.querySelectorAll('.notify-item.unread').forEach(function(i){ i.classList.remove('unread'); });
          var dot = document.getElementById('header-badge-dot');
          if (dot) dot.remove();
          notifyPopover.querySelector('.notify-popover-head strong').textContent = 'Thông báo (0)';
        });
      }
    }

    document.addEventListener('click', function (e) {
      if (userDropdown && !userDropdown.contains(e.target) && e.target !== userBtn) {
        userDropdown.classList.remove('show');
      }
      if (notifyPopover && !notifyPopover.contains(e.target) && e.target !== notifyBtn) {
        notifyPopover.classList.remove('show');
      }
    });

    /* Menu mobile: hiển thị hồ sơ cá nhân và nút đăng xuất */
    document.querySelectorAll('.nav-auth').forEach(function (n) { n.remove(); });
    document.querySelector('.header-inner nav').insertAdjacentHTML('beforeend',
      '<div style="padding: 10px 12px; margin-top: 8px; border-top: 1px solid #edf0f8; display: flex; align-items: center; gap: 10px;">' +
        '<span class="header-user-avatar" style="width: 32px; height: 32px; font-size: 13px;">' + HG.esc(userInitial) + '</span>' +
        '<div><strong style="display:block; font-size: 13px;">' + HG.esc(me.full_name) + '</strong><small style="color:#7a8499; font-size: 11px;">' + HG.esc(roleLabel) + '</small></div>' +
      '</div>' +
      '<a class="nav-auth" href="' + dashUrl + '">' + HG.icon('home', 16) + ' Vào Dashboard</a>' +
      '<button class="nav-auth" style="color: #e54d6e;" type="button" data-logout>' + HG.icon('logout', 16) + ' Đăng xuất</button>');
  }
  var toggle = document.getElementById('menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.querySelector('.header-inner nav').classList.toggle('open');
      toggle.querySelector('use').setAttribute('href', open ? '#i-x' : '#i-menu');
    });
  }
})();
