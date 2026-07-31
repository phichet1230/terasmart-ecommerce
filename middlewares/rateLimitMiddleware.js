/**
 * 🛡️ Enterprise Rate Limiter Middleware (Anti Brute-Force & DoS Protection)
 * International Security Standard (OWASP API Security Top 10)
 */

class RateLimiter {
  constructor() {
    this.hits = new Map();
    // Cleanup stale IP records every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.hits.entries()) {
      if (record.resetTime < now) {
        this.hits.delete(key);
      }
    }
  }

  limit({ windowMs = 60000, max = 100, message = 'คำขอส่งถี่เกินกำหนด กรุณาลองใหม่อีกครั้งในภายหลัง' }) {
    return (req, res, next) => {
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const key = `${req.baseUrl}${req.path}:${ip}`;
      const now = Date.now();

      let record = this.hits.get(key);
      if (!record || record.resetTime < now) {
        record = { count: 1, resetTime: now + windowMs };
        this.hits.set(key, record);
      } else {
        record.count++;
      }

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

      if (record.count > max) {
        return res.status(429).json({
          status: 'error',
          message
        });
      }

      next();
    };
  }
}

const limiterInstance = new RateLimiter();

module.exports = {
  authLimiter: limiterInstance.limit({
    windowMs: 60 * 1000, // 1 นาที
    max: 10, // ไม่เกิน 10 ครั้ง/นาที
    message: 'เข้าสู่ระบบถี่เกินกำหนด เพื่อความปลอดภัยโปรดลองใหม่ใน 1 นาที'
  }),
  apiLimiter: limiterInstance.limit({
    windowMs: 60 * 1000,
    max: 200,
    message: 'ส่งคำขอถี่เกินกำหนด กรุณาเว้นช่วงสักครู่'
  }),
  uploadLimiter: limiterInstance.limit({
    windowMs: 60 * 1000,
    max: 15,
    message: 'อัปโหลดสลิป/ไฟล์ถี่เกินกำหนด กรุณารอสักครู่'
  })
};
