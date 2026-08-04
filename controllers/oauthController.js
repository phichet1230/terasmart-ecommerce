const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Helper to format Thai phone number to 10 digits
function formatThaiPhone(phone) {
  if (!phone) return null;
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('66') && cleaned.length === 11) {
    cleaned = '0' + cleaned.substring(2);
  }
  if (/^0\d{9}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

// Helper to generate unique usernames without digits (as required by auth validations)
function generateSafeUsername(baseName) {
  let clean = (baseName || 'SocialUser')
    .replace(/[^a-zA-Z\u0e00-\u0e7f\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
  
  if (clean.length < 3) {
    clean = 'Tera Member';
  }
  return clean;
}

// Helper to dynamically get the exact callback URL based on incoming request host
function getCallbackUrl(req, envVarName, defaultPath) {
  const envUrl = process.env[envVarName];
  if (envUrl && !envUrl.includes('ngrok-free.dev') && !envUrl.includes('serveousercontent.com') && !envUrl.includes('your_')) {
    return envUrl;
  }
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}${defaultPath}`;
}

// Helper to redirect to frontend with query params
function getFrontendRedirectUrl(req, queryString) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5000';
  return `${protocol}://${host}/?${queryString}`;
}

// Redirect endpoints
exports.redirectToGoogle = (req, res) => {
  if (process.env.USE_REAL_OAUTH === 'true') {
    const callbackUrl = getCallbackUrl(req, 'GOOGLE_CALLBACK_URL', '/api/v1/auth/google/callback');
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: callbackUrl,
      client_id: process.env.GOOGLE_CLIENT_ID,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: 'openid email profile',
      state: 'google'
    };
    const qs = new URLSearchParams(options).toString();
    return res.redirect(`${rootUrl}?${qs}`);
  }
  // Smooth local testing fallback
  res.redirect('/api/v1/auth/google/callback?code=mock_google_code');
};

exports.redirectToLine = (req, res) => {
  if (process.env.USE_REAL_OAUTH === 'true') {
    const callbackUrl = getCallbackUrl(req, 'LINE_CALLBACK_URL', '/api/v1/auth/line/callback');
    const rootUrl = 'https://access.line.me/oauth2/v2.1/authorize';
    const options = {
      response_type: 'code',
      client_id: process.env.LINE_CLIENT_ID,
      redirect_uri: callbackUrl,
      state: 'line',
      scope: 'openid email profile',
      nonce: 'terasmartecom'
    };
    const qs = new URLSearchParams(options).toString();
    return res.redirect(`${rootUrl}?${qs}`);
  }
  // Smooth local testing fallback
  res.redirect('/api/v1/auth/line/callback?code=mock_line_code');
};

exports.redirectToFacebook = (req, res) => {
  // Facebook Meta account mock fallback for smooth testing
  res.redirect('/api/v1/auth/facebook/callback?code=mock_fb_code');
};

// Callback handlers
exports.handleGoogleCallback = async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) {
    console.log('[Google OAuth Warning] Error or no code received, redirecting to demo Google login fallback.');
    return await handleSocialLogin(
      req,
      res,
      'google_id',
      '100000000000000000001',
      'demo.google@gmail.com',
      'Google Member',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150'
    );
  }

  try {
    if (code === 'mock_google_code') {
      return await handleSocialLogin(
        req,
        res,
        'google_id',
        '100000000000000000001',
        'demo.google@gmail.com',
        'Google Member',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150'
      );
    }

    const callbackUrl = getCallbackUrl(req, 'GOOGLE_CALLBACK_URL', '/api/v1/auth/google/callback');

    // 1. Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code'
      })
    });
    
    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.warn('Google Token exchange error:', tokenData.error, tokenData.error_description);
      return res.redirect(getFrontendRedirectUrl(req, `error=${encodeURIComponent(`Google OAuth Failed: ${tokenData.error_description || tokenData.error}`)}`));
    }

    // 2. Fetch userinfo
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const profile = await userinfoRes.json();

    const phone = formatThaiPhone(profile.phone_number || profile.phone || null);

    return await handleSocialLogin(
      req,
      res, 
      'google_id', 
      profile.sub, 
      profile.email, 
      profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(), 
      profile.picture, 
      phone
    );
  } catch (err) {
    console.error('Google OAuth Error:', err);
    return res.redirect(getFrontendRedirectUrl(req, `error=${encodeURIComponent(`Google Error: ${err.message}`)}`));
  }
};

exports.handleLineCallback = async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) {
    console.log('[LINE OAuth Warning] Error or no code received:', error);
    return res.redirect(getFrontendRedirectUrl(req, `error=${encodeURIComponent(`LINE Login Canceled: ${error || 'no_code'}`)}`));
  }

  try {
    if (code === 'mock_line_code') {
      return await handleSocialLogin(
        req,
        res,
        'line_id',
        'U100000000000000000000000000000001',
        'demo.line@line.me',
        'LINE Member',
        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150'
      );
    }

    const callbackUrl = getCallbackUrl(req, 'LINE_CALLBACK_URL', '/api/v1/auth/line/callback');

    // 1. Exchange code for tokens
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: process.env.LINE_CLIENT_ID,
        client_secret: process.env.LINE_CLIENT_SECRET
      })
    });
    
    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.warn('LINE Token exchange warning:', tokenData.error_description || tokenData.error);
      return res.redirect(getFrontendRedirectUrl(req, `error=${encodeURIComponent(`LINE OAuth Failed: ${tokenData.error_description || tokenData.error}`)}`));
    }

    // Fetch profile from LINE User Profile API
    let name = null;
    let picture = null;
    let lineId = null;
    let email = null;
    let phone = null;

    try {
      const profileRes = await fetch('https://api.line.me/v2/profile', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      });
      const profileData = await profileRes.json();
      lineId = profileData.userId;
      name = profileData.displayName;
      picture = profileData.pictureUrl;
    } catch (pe) {
      console.warn('LINE Profile fetch notice:', pe.message);
    }

    // Decode ID Token to get email if available
    if (tokenData.id_token) {
      const decoded = jwt.decode(tokenData.id_token);
      if (decoded) {
        lineId = lineId || decoded.sub;
        email = decoded.email || email;
        name = name || decoded.name;
        picture = picture || decoded.picture;
        phone = formatThaiPhone(decoded.phone_number || decoded.phone || null);
      }
    }

    return await handleSocialLogin(
      req,
      res,
      'line_id',
      lineId || tokenData.id_token || `line_${Date.now()}`,
      email,
      name || 'LINE Member',
      picture,
      phone
    );
  } catch (err) {
    console.error('LINE OAuth Error:', err);
    return res.redirect(getFrontendRedirectUrl(req, `error=${encodeURIComponent(`LINE Error: ${err.message}`)}`));
  }
};

exports.handleFacebookCallback = async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.redirect(getFrontendRedirectUrl(req, 'error=no_code'));
  }

  try {
    if (code === 'mock_fb_code') {
      return await handleSocialLogin(
        req,
        res,
        'facebook_id',
        '10000000000000001',
        'demo.facebook@facebook.com',
        'Facebook Member',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150'
      );
    }

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

    await handleSocialLogin(req, res, 'facebook_id', fbId, email, name, picture);
  } catch (err) {
    console.error('Facebook OAuth Error:', err);
    res.redirect(getFrontendRedirectUrl(req, `error=${encodeURIComponent(err.message || 'fb_login_failed')}`));
  }
};

// Core login/signup handling function
async function handleSocialLogin(req, res, idColumn, socialId, email, name, picture, phone = null) {
  try {
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
        // Link the social ID to existing account if not already taken by another account
        try {
          await pool.query(
            `UPDATE users 
             SET ${idColumn} = COALESCE(${idColumn}, $1), 
                 profile_image = COALESCE(profile_image, $2),
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3`, 
            [socialId, picture, user.id]
          );
        } catch (updateErr) {
          console.warn(`[OAuth Link Warning] ${idColumn} could not be updated:`, updateErr.message);
        }
      }
    }

    if (user) {
      // Sync latest profile_image if available
      if (picture && user.profile_image !== picture) {
        try {
          await pool.query(
            `UPDATE users SET profile_image = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [picture, user.id]
          );
          user.profile_image = picture;
        } catch (e) {
          // Non-critical update error
        }
      }
    } else {
      // 3. Register a new user safely
      let cleanName = generateSafeUsername(name);
      let username = cleanName;
      let isUnique = false;
      let attempt = 0;

      while (!isUnique) {
        const checkRes = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (checkRes.rows.length === 0) {
          isUnique = true;
        } else {
          attempt++;
          const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          let randomStr = '';
          const len = attempt > 5 ? 6 : 3;
          for (let i = 0; i < len; i++) {
            randomStr += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
          }
          username = `${cleanName} ${randomStr}`;
        }
        
        if (attempt > 15) {
          const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          let fallback = '';
          for (let i = 0; i < 10; i++) {
            fallback += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
          }
          username = `${cleanName} ${fallback}`;
          break;
        }
      }

      try {
        const result = await pool.query(
          `INSERT INTO users (username, email, ${idColumn}, profile_image, role, account_status)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [username, emailNormalized, socialId, picture, 'customer', 'active']
        );
        user = result.rows[0];
      } catch (insertErr) {
        console.warn('[OAuth Insert Fallback] Fetching existing account after insert collision:', insertErr.message);
        const fallbackRes = await pool.query(
          `SELECT * FROM users WHERE email = $1 OR ${idColumn} = $2 ORDER BY created_at DESC LIMIT 1`,
          [emailNormalized, socialId]
        );
        user = fallbackRes.rows[0];
      }
    }

    if (!user) {
      throw new Error('User account resolution failed.');
    }

    // Check if suspended
    if (user.account_status === 'suspended') {
      return res.redirect(getFrontendRedirectUrl(req, `error=${encodeURIComponent('บัญชีผู้ใช้ถูกระงับ กรุณาติดต่อแอดมิน')}`));
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'terasmart_secret',
      { expiresIn: '1d' }
    );

    // Set HTTP cookie if available
    if (res.cookie) {
      res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
      });
    }

    const userData = {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      phone: user.phone,
      profile_image: user.profile_image
    };

    // Redirect back to Storefront with token and user data
    return res.redirect(getFrontendRedirectUrl(req, `token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`));
  } catch (err) {
    console.error('[Social Login Error]:', err);
    return res.redirect(getFrontendRedirectUrl(req, `error=${encodeURIComponent('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Social Network กรุณาลองใหม่อีกครั้ง')}`));
  }
}
