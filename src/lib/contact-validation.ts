const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
/** Indicatif optionnel (+ ou 00), 8 à 15 chiffres, espaces / points / tirets / parenthèses. */
const PHONE_RE = /^(?:\+|00)?[0-9](?:[\s().-]*[0-9]){7,14}$/;

function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

function isPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!PHONE_RE.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

export type ContactField = 'lastName' | 'email' | 'phone' | 'message' | 'service';
export type ContactFieldIssue = 'required' | 'invalid';

export function contactFieldErrors(input: {
  lastName: string;
  email: string;
  phone: string;
  message: string;
  service: string;
  serviceRequired: boolean;
}): Partial<Record<ContactField, ContactFieldIssue>> {
  const errors: Partial<Record<ContactField, ContactFieldIssue>> = {};
  if (!input.lastName.trim()) errors.lastName = 'required';
  if (!input.email.trim()) errors.email = 'required';
  else if (!isEmail(input.email)) errors.email = 'invalid';
  if (!input.phone.trim()) errors.phone = 'required';
  else if (!isPhone(input.phone)) errors.phone = 'invalid';
  if (!input.message.trim()) errors.message = 'required';
  if (input.serviceRequired && !input.service.trim()) errors.service = 'required';
  return errors;
}
