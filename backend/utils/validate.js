const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmail(value) {
  if (typeof value !== 'string') return false;
  return EMAIL_REGEX.test(value.trim());
}

function isNumberInRange(value, min, max) {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return false;
  }
  return value >= min && value <= max;
}

function parsePositiveInt(value) {
  if (value === undefined || value === null || value === '') return null;
  const str = String(value).trim();
  if (!/^[1-9]\d*$/.test(str)) return null;
  const num = Number(str);
  return Number.isSafeInteger(num) && num > 0 ? num : null;
}

function pick(obj, allowedKeys) {
  const result = {};
  if (!obj || typeof obj !== 'object') return result;

  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
      const val = obj[key];
      result[key] = typeof val === 'string' ? val.trim() : val;
    }
  }
  return result;
}

function createHttpError(status, message, details) {
  const err = new Error(message);
  err.status = status;
  if (details) {
    err.details = details;
  }
  return err;
}

function mapDatabaseError(error) {
  if (!error) return createHttpError(500, 'Internal server error');
  if (error.code === '23505') {
    return createHttpError(409, 'Already exists');
  }
  if (error.code === '23503') {
    return createHttpError(400, 'Referenced record does not exist');
  }
  if (error.code === '23514' || error.code === '22P02') {
    return createHttpError(400, error.message || 'Invalid field value');
  }
  const err = createHttpError(500, 'Internal server error');
  err.cause = error;
  return err;
}

module.exports = {
  isEmail,
  isNumberInRange,
  parsePositiveInt,
  pick,
  createHttpError,
  mapDatabaseError,
};

