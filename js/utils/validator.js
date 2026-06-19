export const validator = {
  validateBirthDetails(d) {
    if (!d.name || d.name.trim().length < 2) {
      return { ok: false, error: 'Name must be at least 2 characters long.' };
    }
    if (!d.dob || !/^\d{4}-\d{2}-\d{2}$/.test(d.dob)) {
      return { ok: false, error: 'Please enter a valid Date of Birth.' };
    }
    if (!d.place || d.place.trim().length < 3) {
      return { ok: false, error: 'Please select a valid place of birth.' };
    }
    return { ok: true };
  }
};
