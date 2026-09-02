import { useMemo, useState, type FormEvent } from 'react';
import { t, type Labels } from '../../lib/i18n';

interface Props {
  labels: Labels;
}

interface FormState {
  lastName: string;
  firstName: string;
  email: string;
  phone: string;
  message: string;
  companyUrl: string;
}

const initial: FormState = {
  lastName: '',
  firstName: '',
  email: '',
  phone: '',
  message: '',
  companyUrl: '',
};

export default function ContactForm({ labels }: Props) {
  const [form, setForm] = useState<FormState>(initial);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error' | 'invalid'>('idle');

  const valid = useMemo(
    () => form.lastName.trim() && form.email.trim() && form.phone.trim() && form.message.trim(),
    [form],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) {
      setStatus('invalid');
      return;
    }

    setStatus('sending');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus(response.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const fieldClass =
    'w-full rounded-2xl border border-brand/20 bg-paper px-4 py-3 text-ink outline-none transition focus:border-brand';

  return (
    <form className="grid gap-5 md:grid-cols-2" onSubmit={onSubmit} noValidate>
      <label className="grid gap-2 text-sm">
        {t(labels, 'form.lastName')} *
        <input className={fieldClass} name="lastName" autoComplete="family-name" required value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
      </label>
      <label className="grid gap-2 text-sm">
        {t(labels, 'form.firstName')}
        <input className={fieldClass} name="firstName" autoComplete="given-name" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
      </label>
      <label className="grid gap-2 text-sm">
        {t(labels, 'form.email')} *
        <input className={fieldClass} name="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
      </label>
      <label className="grid gap-2 text-sm">
        {t(labels, 'form.phone')} *
        <input className={fieldClass} name="phone" type="tel" autoComplete="tel" required value={form.phone} onChange={(e) => update('phone', e.target.value)} />
      </label>
      <label className="grid gap-2 text-sm md:col-span-2">
        {t(labels, 'form.message')} *
        <textarea className={`${fieldClass} min-h-36`} name="message" required value={form.message} onChange={(e) => update('message', e.target.value)} />
      </label>
      <div className="hidden" aria-hidden="true">
        <label>
          {t(labels, 'form.honeypot')}
          <input name="companyUrl" tabIndex={-1} autoComplete="off" value={form.companyUrl} onChange={(e) => update('companyUrl', e.target.value)} />
        </label>
      </div>
      <div className="md:col-span-2">
        <button
          type="submit"
          className="rounded-full bg-brand px-7 py-3 text-sm font-semibold text-paper disabled:opacity-60"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? t(labels, 'form.sending') : t(labels, 'form.submit')}
        </button>
      </div>
      {status === 'success' && <p className="md:col-span-2 rounded-2xl bg-brand/10 px-4 py-3 text-brand" role="status">{t(labels, 'form.success')}</p>}
      {status === 'error' && <p className="md:col-span-2 rounded-2xl bg-red-50 px-4 py-3 text-red-800" role="alert">{t(labels, 'form.error')}</p>}
      {status === 'invalid' && <p className="md:col-span-2 text-brand" role="alert">{t(labels, 'form.invalid')}</p>}
    </form>
  );
}
