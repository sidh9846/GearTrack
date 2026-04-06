const CATEGORIES = ["Controller", "Mixer", "Speaker", "Microphone", "Lighting", "Stand", "Accessory"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Damaged"];

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalText(value, maxLength = 500) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

function isValidUsername(username) {
  return /^[a-zA-Z0-9._-]{3,30}$/.test(username);
}

function isValidDisplayName(displayName) {
  return displayName.length >= 2 && displayName.length <= 50;
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 72;
}

function isValidSerial(serial) {
  return /^[A-Za-z0-9-]{4,40}$/.test(serial);
}

function isValidName(name) {
  return name.length >= 2 && name.length <= 80;
}

function validateUserInput({ username, display_name, role, password }) {
  const clean = {
    username: normalizeText(username).toLowerCase(),
    display_name: normalizeText(display_name),
    role: normalizeText(role),
    password: typeof password === 'string' ? password : '',
  };

  if (!isValidUsername(clean.username)) {
    return { error: 'Username must be 3-30 characters and use only letters, numbers, dots, underscores, or hyphens.', clean };
  }

  if (!isValidDisplayName(clean.display_name)) {
    return { error: 'Display name must be between 2 and 50 characters.', clean };
  }

  if (!["admin", "user"].includes(clean.role)) {
    return { error: 'Invalid role selected.', clean };
  }

  if (!isValidPassword(clean.password)) {
    return { error: 'Password must be between 8 and 72 characters.', clean };
  }

  return { error: null, clean };
}

function validateEquipmentInput({ name, category, serial, condition, notes }) {
  const clean = {
    name: normalizeText(name),
    category: normalizeText(category),
    serial: normalizeText(serial).toUpperCase(),
    condition: normalizeText(condition),
    notes: normalizeOptionalText(notes, 500),
  };

  if (!isValidName(clean.name)) {
    return { error: 'Equipment name must be between 2 and 80 characters.', clean };
  }

  if (!CATEGORIES.includes(clean.category)) {
    return { error: 'Invalid category selected.', clean };
  }

  if (!isValidSerial(clean.serial)) {
    return { error: 'Serial must be 4-40 characters and use only letters, numbers, or hyphens.', clean };
  }

  if (!CONDITIONS.includes(clean.condition)) {
    return { error: 'Invalid condition selected.', clean };
  }

  return { error: null, clean };
}

function validateConditionAndNotes(condition, notes) {
  const cleanCondition = normalizeText(condition);
  const cleanNotes = normalizeOptionalText(notes, 500);

  if (!CONDITIONS.includes(cleanCondition)) {
    return { error: 'Invalid condition selected.', cleanCondition, cleanNotes };
  }

  return { error: null, cleanCondition, cleanNotes };
}

module.exports = {
  CATEGORIES,
  CONDITIONS,
  normalizeText,
  validateUserInput,
  validateEquipmentInput,
  validateConditionAndNotes,
};
