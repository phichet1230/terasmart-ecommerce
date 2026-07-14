const pool = require('../config/db');
const jwt = require('jsonwebtoken');
// Using native global fetch available in Node.js v18+

// Helper to generate unique usernames without digits (as required by auth validations)
function generateSafeUsername(baseName) {
  let clean = (baseName || 'SocialUser')
    .replace(/[^a-zA-Z\u0e00-\u0e7f\s]/g, '')
    .trim()
    .replace(/\s+/g, '');
  
  if (clean.length < 3) {
    clean = 'TeraMember';
  }
  
  // Append 6 random alphabetic characters (no numbers!) to guarantee uniqueness
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomStr = '';
  for (let i = 0; i < 6; i++) {
    randomStr += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return clean + randomStr;
}

// Redirect endpoints
exports.redirectToGoogle = (req, res) => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: 'openid email profile',
    state: 'google'
  };

  const qs = new URLSearchParams(options).toString();
  res.redirect(`${rootUrl}?${qs}`);
};

exports.redirectToLine = (req, res) => {
  const rootUrl = 'https://access.line.me/oauth2/v2.1/authorize';
  const options = {
    response_type: 'code',
    client_id: process.env.LINE_CLIENT_ID,
    redirect_uri: process.env.LINE_CALLBACK_URL,
    state: 'line',
    scope: 'openid email profile',
    nonce: 'terasmartecom'
  };

  const qs = new URLSearchParams(options).toString();
  res.redirect(`${rootUrl}?${qs}`);
};

exports.redirectToFacebook = (req, res) => {
  const rootUrl = 'https://www.facebook.com/v18.0/dialog/oauth';
  const options = {
    client_id: process.env.FACEBOOK_CLIENT_ID,
    redirect_uri: process.env.FACEBOOK_CALLBACK_URL,
    state: 'facebook',
    scope: 'email,public_profile'
  };

  const qs = new URLSearchParams(options).toString();
  res.redirect(`${rootUrl}?${qs}`);
};

// Callback handlers
exports.handleGoogleCallback = async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.redirect('/index.html?error=no_code');
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code'
      })
    });
    
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description || 'Google Token exchange failed');

    // 2. Fetch userinfo
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const profile = await userinfoRes.json();

    await handleSocialLogin(res, 'google_id', profile.sub, profile.email, profile.name, profile.picture);
  } catch (err) {
    console.error('Google OAuth Error:', err);
    res.redirect(`/index.html?error=${encodeURIComponent(err.message || 'google_login_failed')}`);
  }
};

exports.handleLineCallback = async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.redirect('/index.html?error=no_code');
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINE_CALLBACK_URL,
        client_id: process.env.LINE_CLIENT_ID,
        client_secret: process.env.LINE_CLIENT_SECRET
      })
    });
    
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description || 'LINE Token exchange failed');

    // Decode ID Token to get email and details
    const decoded = jwt.decode(tokenData.id_token);
    const lineId = decoded.sub;
    const email = decoded.email;
    const name = decoded.name;
    const picture = decoded.picture;

    await handleSocialLogin(res, 'line_id', lineId, email, name, picture);
  } catch (err) {
    console.error('LINE OAuth Error:', err);
    res.redirect(`/index.html?error=${encodeURIComponent(err.message || 'line_login_failed')}`);
  }
};

exports.handleFacebookCallback = async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.redirect('/index.html?error=no_code');
  }

  try {
    // 1. Exchange code for token
    const tokenRes = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.FACEBOOK_CLIENT_ID,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET,
        redirect_uri: process.env.FACEBOOK_CALLBACK_URL,
        code
      })
    });
    
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error.message || 'Facebook Token exchange failed');

    // 2. Fetch profile fields
    const userinfoRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`);
    const profile = await userinfoRes.json();
    
    const fbId = profile.id;
    const email = profile.email;
    const name = profile.name;
    const picture = profile.picture && profile.picture.data ? profile.picture.data.url : null;

    await handleSocialLogin(res, 'facebook_id', fbId, email, name, picture);
  } catch (err) {
    console.error('Facebook OAuth Error:', err);
    res.redirect(`/index.html?error=${encodeURIComponent(err.message || 'fb_login_failed')}`);
  }
};

// Core login/signup handling function
async function handleSocialLogin(res, idColumn, socialId, email, name, picture) {
  let emailNormalized = email ? email.trim().toLowerCase() : null;
  if (!emailNormalized) {
    const providerPrefix = idColumn.replace('_id', '');
    emailNormalized = `${providerPrefix}_${socialId}@terasmartecom.temporary`;
  }
  
  // 1. Check if user is already linked with this social ID
  let userResult = await pool.query(`SELECT * FROM users WHERE ${idColumn} = $1`, [socialId]);
  let user = userResult.rows[0];

  if (!user && emailNormalized) {
    // 2. Check if a user with this email exists
    const emailResult = await pool.query('SELECT * FROM users WHERE email = $1', [emailNormalized]);
    user = emailResult.rows[0];
    
    if (user) {
      // Link the social ID to existing account
      await pool.query(`UPDATE users SET ${idColumn} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [socialId, user.id]);
      user[idColumn] = socialId;
    }
  }

  if (!user) {
    // 3. Register a new user
    const username = generateSafeUsername(name);
    const result = await pool.query(
      `INSERT INTO users (username, email, ${idColumn}, profile_image, role, account_status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [username, emailNormalized, socialId, picture, 'customer', 'active']
    );
    user = result.rows[0];
  }

  // Check if suspended
  if (user.account_status === 'suspended') {
    return res.redirect(`/index.html?error=${encodeURIComponent('บัญชีผู้ใช้ถูกระงับ กรุณาติดต่อแอดมิน')}`);
  }

  // 4. Generate JWT
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  // Set HTTP cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  });

  const userData = {
    id: user.id,
    username: user.username,
    role: user.role,
    email: user.email,
    phone: user.phone,
    profile_image: user.profile_image
  };

  // Redirect back to frontend
  res.redirect(`/index.html?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
}
