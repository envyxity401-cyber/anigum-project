// shared auth db using localstorage
var DB = {
  users: function() { return JSON.parse(localStorage.getItem('anigum_users') || '[]') },
  saveUsers: function(u) { localStorage.setItem('anigum_users', JSON.stringify(u)) },
  currentUser: function() { return JSON.parse(localStorage.getItem('anigum_current') || 'null') },
  setCurrentUser: function(u) { localStorage.setItem('anigum_current', JSON.stringify(u)) },
  logout: function() { localStorage.removeItem('anigum_current'); location.reload() }
}

function hashPwd(pwd) {
  var h = 0
  for (var i = 0; i < pwd.length; i++) h = ((h << 5) - h + pwd.charCodeAt(i)) | 0
  return String(h)
}

function signup(email, username, password) {
  var users = DB.users()
  if (users.find(function(u) { return u.email === email })) return { ok: false, err: 'email already used' }
  var newUser = { email: email, username: username, pwd: hashPwd(password), avatar: username[0].toUpperCase(), joined: Date.now(), provider: 'email' }
  users.push(newUser)
  DB.saveUsers(users)
  DB.setCurrentUser(newUser)
  return { ok: true }
}

function login(email, password) {
  var users = DB.users()
  var u = users.find(function(u) { return u.email === email && u.pwd === hashPwd(password) })
  if (!u) return { ok: false, err: 'invalid email or password' }
  DB.setCurrentUser(u)
  return { ok: true }
}

function oauthLogin(provider) {
  var username = provider + '_user_' + Math.floor(Math.random() * 9999)
  var email = username + '@' + provider + '.local'
  var newUser = { email: email, username: username, pwd: '', avatar: provider[0].toUpperCase(), joined: Date.now(), provider: provider }
  var users = DB.users()
  users.push(newUser)
  DB.saveUsers(users)
  DB.setCurrentUser(newUser)
  location.reload()
}

function injectAuthUI() {
  var css = '<style>'
  + '.auth-btn{background:var(--accent);border:none;color:white;padding:7px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all 0.2s;white-space:nowrap}'
  + '.auth-btn:hover{background:var(--accent-dark);transform:translateY(-1px)}'
  + '.profile-chip{display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--border);padding:5px 12px 5px 5px;border-radius:20px;cursor:pointer;transition:all 0.2s}'
  + '.profile-chip:hover{border-color:var(--accent)}'
  + '.profile-avatar{width:28px;height:28px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white}'
  + '.profile-name{font-size:12px;font-weight:600;color:var(--text)}'
  + '.auth-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:5000;display:none;align-items:center;justify-content:center;padding:20px}'
  + '.auth-overlay.on{display:flex}'
  + '.auth-modal{background:var(--bg2);border:1px solid var(--border2);border-radius:18px;padding:32px;width:100%;max-width:390px;position:relative;animation:modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)}'
  + '@keyframes modalIn{from{transform:scale(0.92) translateY(16px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}'
  + '.auth-close{position:absolute;top:14px;right:14px;background:var(--card);border:1px solid var(--border);color:var(--text2);font-size:16px;cursor:pointer;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:all 0.2s;line-height:1}'
  + '.auth-close:hover{background:var(--card2);color:var(--text)}'
  + '.auth-title{font-size:20px;font-weight:700;margin-bottom:6px;font-family:var(--font-head)}'
  + '.auth-sub{font-size:13px;color:var(--text2);margin-bottom:22px}'
  + '.auth-input{width:100%;background:var(--card);border:1px solid var(--border);border-radius:9px;padding:11px 14px;color:var(--text);font-family:var(--font);font-size:13px;outline:none;margin-bottom:10px;transition:border-color 0.2s;box-sizing:border-box}'
  + '.auth-input:focus{border-color:var(--accent)}'
  + '.auth-submit{width:100%;background:var(--accent);border:none;color:white;padding:12px;border-radius:9px;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--font);margin-top:4px;transition:all 0.2s}'
  + '.auth-submit:hover{background:var(--accent-dark);transform:translateY(-1px)}'
  + '.auth-divider{display:flex;align-items:center;gap:10px;margin:18px 0;color:var(--text3);font-size:11px;font-weight:500}'
  + '.auth-divider::before,.auth-divider::after{content:"";flex:1;height:1px;background:var(--border)}'
  + '.oauth-btns{display:flex;gap:8px}'
  + '.oauth-btn{flex:1;background:var(--card);border:1px solid var(--border);color:var(--text);padding:10px;border-radius:9px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);display:flex;align-items:center;justify-content:center;gap:7px;transition:all 0.2s}'
  + '.oauth-btn:hover{background:var(--card2);border-color:var(--accent)}'
  + '.auth-switch{text-align:center;margin-top:16px;font-size:12px;color:var(--text2)}'
  + '.auth-switch a{color:var(--accent);cursor:pointer;font-weight:600}'
  + '.auth-err{color:#ff6b6b;font-size:11px;margin-bottom:10px;display:none}'
  + '.auth-err.on{display:block}'
  + '.profile-wrap{position:relative;margin-left:8px;flex-shrink:0}'
  + '.profile-menu{position:absolute;top:calc(100% + 8px);right:0;background:var(--bg2);border:1px solid var(--border2);border-radius:12px;padding:8px;min-width:210px;display:none;z-index:1001;box-shadow:0 12px 32px rgba(0,0,0,0.5)}'
  + '.profile-menu.on{display:block;animation:modalIn 0.15s ease}'
  + '.profile-menu-head{padding:10px 12px;border-bottom:1px solid var(--border);margin-bottom:6px}'
  + '.profile-menu-name{font-size:13px;font-weight:700}'
  + '.profile-menu-email{font-size:10px;color:var(--text3);margin-top:2px}'
  + '.pmenu-item{display:block;padding:8px 12px;border-radius:7px;font-size:12px;color:var(--text2);cursor:pointer;transition:all 0.2s;border:none;background:none;width:100%;text-align:left;font-family:var(--font)}'
  + '.pmenu-item:hover{background:var(--card);color:var(--text)}'
  // live search styles
  + '.live-search{position:fixed;top:60px;left:0;right:0;z-index:4000;background:rgba(11,11,16,0.98);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);max-height:72vh;overflow-y:auto;display:none;padding:8px 0}'
  + '.live-search.on{display:block;animation:fadeDown 0.18s ease}'
  + '@keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}'
  + '.live-inner{max-width:720px;margin:0 auto;padding:0 20px}'
  + '.live-label{font-size:10px;color:var(--text3);font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:8px 0 6px}'
  + '.live-result{display:flex;gap:12px;padding:10px 12px;border-radius:10px;cursor:pointer;transition:background 0.15s;text-decoration:none}'
  + '.live-result:hover{background:var(--card)}'
  + '.live-thumb{width:44px;height:60px;border-radius:7px;overflow:hidden;flex-shrink:0;background:var(--card)}'
  + '.live-thumb img{width:100%;height:100%;object-fit:cover}'
  + '.live-info{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:3px}'
  + '.live-title{font-size:13px;font-weight:600;line-height:1.3;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  + '.live-meta{font-size:11px;color:var(--text3)}'
  + '.live-score{font-size:11px;color:#fbbf24;font-weight:600}'
  + '.live-empty{padding:28px;text-align:center;color:var(--text3);font-size:13px}'
  + '.live-footer{padding:10px 12px;border-top:1px solid var(--border);margin-top:4px;text-align:center}'
  + '.live-footer a{font-size:12px;color:var(--accent);font-weight:600;cursor:pointer}'
  + '</style>'

  var modal = '<div class="auth-overlay" id="authOverlay" onclick="if(event.target===this)closeAuth()">'
  + '<div class="auth-modal">'
  + '<button class="auth-close" onclick="closeAuth()">✕</button>'
  + '<div id="authLoginView">'
  + '<div class="auth-title">welcome back</div>'
  + '<div class="auth-sub">log in to continue watching</div>'
  + '<div class="auth-err" id="loginErr"></div>'
  + '<input class="auth-input" type="email" id="loginEmail" placeholder="email address">'
  + '<input class="auth-input" type="password" id="loginPwd" placeholder="password">'
  + '<button class="auth-submit" onclick="doLogin()">log in</button>'
  + '<div class="auth-divider">or continue with</div>'
  + '<div class="oauth-btns">'
  + '<button class="oauth-btn" onclick="oauthLogin(\'google\')"><svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>google</button>'
  + '<button class="oauth-btn" onclick="oauthLogin(\'discord\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>discord</button>'
  + '</div>'
  + '<div class="auth-switch">no account? <a onclick="showSignup()">sign up free</a></div>'
  + '</div>'
  + '<div id="authSignupView" style="display:none">'
  + '<div class="auth-title">create account</div>'
  + '<div class="auth-sub">join anigum for free</div>'
  + '<div class="auth-err" id="signupErr"></div>'
  + '<input class="auth-input" type="text" id="signupUser" placeholder="username">'
  + '<input class="auth-input" type="email" id="signupEmail" placeholder="email address">'
  + '<input class="auth-input" type="password" id="signupPwd" placeholder="password (min 6 chars)">'
  + '<button class="auth-submit" onclick="doSignup()">create account</button>'
  + '<div class="auth-divider">or continue with</div>'
  + '<div class="oauth-btns">'
  + '<button class="oauth-btn" onclick="oauthLogin(\'google\')"><svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>google</button>'
  + '<button class="oauth-btn" onclick="oauthLogin(\'discord\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>discord</button>'
  + '</div>'
  + '<div class="auth-switch">have an account? <a onclick="showLogin()">log in</a></div>'
  + '</div>'
  + '</div></div>'

  var liveSearchEl = '<div class="live-search" id="liveSearchDropdown"><div class="live-inner"><div id="liveResults"></div></div></div>'

  document.head.insertAdjacentHTML('beforeend', css)
  document.body.insertAdjacentHTML('beforeend', modal + liveSearchEl)

  // inject login btn or profile chip into nav
  var navInner = document.querySelector('.nav-inner')
  if (navInner) {
    var user = DB.currentUser()
    var wrap = document.createElement('div')
    wrap.className = 'profile-wrap'
    if (user) {
      wrap.innerHTML = '<div class="profile-chip" onclick="toggleProfileMenu(event)">'
      + '<div class="profile-avatar">' + user.avatar + '</div>'
      + '<span class="profile-name">' + user.username + '</span></div>'
      + '<div class="profile-menu" id="profileMenu">'
      + '<div class="profile-menu-head"><div class="profile-menu-name">' + user.username + '</div><div class="profile-menu-email">' + user.email + '</div></div>'
      + '<button class="pmenu-item" onclick="DB.logout()">log out</button>'
      + '</div>'
    } else {
      wrap.innerHTML = '<button class="auth-btn" onclick="openAuth()">log in</button>'
    }
    navInner.appendChild(wrap)
  }

  // live search wiring
  var ni = document.querySelector('.nav-inner')
  var inp = ni && ni.querySelector('.nav-search input')
  if (inp) {
    var timer = null
    inp.addEventListener('input', function() {
      clearTimeout(timer)
      var q = inp.value.trim()
      if (!q) { closeLiveSearch(); return }
      timer = setTimeout(function() { doLiveSearch(q) }, 320)
    })
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { inp.value = ''; closeLiveSearch() }
    })
    document.addEventListener('click', function(e) {
      var ns = document.querySelector('.nav-search')
      var ls = document.getElementById('liveSearchDropdown')
      if (ns && ls && !ns.contains(e.target) && !ls.contains(e.target)) closeLiveSearch()
    })
  }
}

function doLiveSearch(q) {
  var el = document.getElementById('liveResults')
  var drop = document.getElementById('liveSearchDropdown')
  if (!el || !drop) return
  drop.classList.add('on')
  el.innerHTML = '<div class="live-empty">searching...</div>'
  // no popularity filter here - we want all anime to be searchable
  fetch('https://api.jikan.moe/v4/anime?q=' + encodeURIComponent(q) + '&limit=10&sfw=true')
    .then(function(r) { return r.json() })
    .then(function(d) {
      var data = d.data || []
      if (!data.length) { el.innerHTML = '<div class="live-empty">no results for "' + q + '"</div>'; return }
      var inPages = window.location.pathname.includes('/pages/')
      var base = inPages ? 'watch.html' : 'pages/watch.html'
      el.innerHTML = '<div class="live-label">results for "' + q + '"</div>'
      + data.map(function(a) {
        var img = a.images.webp ? a.images.webp.image_url : a.images.jpg.image_url
        return '<a class="live-result" href="' + base + '?id=' + a.mal_id + '">'
        + '<div class="live-thumb"><img src="' + img + '" loading="lazy"></div>'
        + '<div class="live-info">'
        + '<div class="live-title">' + (a.title_english || a.title) + '</div>'
        + '<div class="live-meta">' + (a.type || 'TV') + ' · ' + (a.episodes || '?') + 'ep · ' + (a.year || '') + '</div>'
        + (a.score ? '<div class="live-score">★ ' + a.score + '</div>' : '')
        + '</div></a>'
      }).join('')
      + '<div class="live-footer"><a onclick="goFullSearch(\'' + q.replace(/'/g, '') + '\')">see all results →</a></div>'
    })
    .catch(function() { el.innerHTML = '<div class="live-empty">search failed, try again</div>' })
}

function goFullSearch(q) {
  var inPages = window.location.pathname.includes('/pages/')
  var base = inPages ? 'search.html' : 'pages/search.html'
  window.location.href = base + '?q=' + encodeURIComponent(q)
}

function closeLiveSearch() {
  var drop = document.getElementById('liveSearchDropdown')
  if (drop) drop.classList.remove('on')
}

function openAuth() { document.getElementById('authOverlay').classList.add('on') }
function closeAuth() { document.getElementById('authOverlay').classList.remove('on') }
function showSignup() { document.getElementById('authLoginView').style.display = 'none'; document.getElementById('authSignupView').style.display = 'block' }
function showLogin() { document.getElementById('authSignupView').style.display = 'none'; document.getElementById('authLoginView').style.display = 'block' }
function toggleProfileMenu(e) { e.stopPropagation(); var m = document.getElementById('profileMenu'); if (m) m.classList.toggle('on') }
document.addEventListener('click', function(e) {
  var m = document.getElementById('profileMenu')
  if (m && m.classList.contains('on') && !m.contains(e.target)) m.classList.remove('on')
})

function doLogin() {
  var email = document.getElementById('loginEmail').value.trim()
  var pwd = document.getElementById('loginPwd').value
  var err = document.getElementById('loginErr')
  if (!email || !pwd) { err.textContent = 'fill in both fields'; err.classList.add('on'); return }
  var r = login(email, pwd)
  if (!r.ok) { err.textContent = r.err; err.classList.add('on'); return }
  location.reload()
}

function doSignup() {
  var user = document.getElementById('signupUser').value.trim()
  var email = document.getElementById('signupEmail').value.trim()
  var pwd = document.getElementById('signupPwd').value
  var err = document.getElementById('signupErr')
  if (!user || !email || !pwd) { err.textContent = 'fill in all fields'; err.classList.add('on'); return }
  if (pwd.length < 6) { err.textContent = 'password must be at least 6 characters'; err.classList.add('on'); return }
  var r = signup(email, user, pwd)
  if (!r.ok) { err.textContent = r.err; err.classList.add('on'); return }
  location.reload()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectAuthUI)
} else {
  injectAuthUI()
}
