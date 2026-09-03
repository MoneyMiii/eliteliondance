import { useState, type FormEvent } from 'react';
import { t, type Labels } from '../../lib/i18n';
import { contactFieldErrors, type ContactField, type ContactFieldIssue } from '../../lib/contact-validation';

export interface ContactServiceOption {
  id: string;
  title: string;
}

interface Props {
  labels: Labels;
  services: ContactServiceOption[];
}

interface FormState {
  lastName: string;
  firstName: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  companyUrl: string;
}

const initial: FormState = {
  lastName: '',
  firstName: '',
  email: '',
  phone: '',
  service: '',
  message: '',
  companyUrl: '',
};

const FALLBACK: Labels = {
  'form.required': 'Ce champ est obligatoire.',
  'form.invalidEmail': 'Adresse e-mail invalide.',
  'form.invalidPhone': 'Numéro de téléphone invalide.',
  'form.invalidService': 'Merci de choisir une prestation.',
  'form.service': 'Prestation',
  'form.servicePlaceholder': 'Choisir une prestation',
};

export default function ContactForm({ labels, services }: Props) {
  const [form, setForm] = useState<FormState>(initial);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ContactField, ContactFieldIssue>>>({});
  const serviceRequired = services.length > 0;

  function label(key: string): string {
    return t(labels, key) || FALLBACK[key] || '';
  }

  function fieldMessage(field: ContactField): string | undefined {
    const issue = fieldErrors[field];
    if (!issue) return undefined;
    if (field === 'email' && issue === 'invalid') return label('form.invalidEmail');
    if (field === 'phone' && issue === 'invalid') return label('form.invalidPhone');
    if (field === 'service') return label('form.invalidService');
    return label('form.required');
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (key in fieldErrors) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[key as ContactField];
        return next;
      });
    }
  }

  function inputClass(field: ContactField): string {
    return [
      'h-auto w-full self-start rounded-2xl border bg-paper px-4 py-3 text-ink outline-none transition focus:border-brand',
      fieldErrors[field] ? 'border-red-700' : 'border-brand/20',
    ].join(' ');
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = contactFieldErrors({
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      message: form.message,
      service: form.service,
      serviceRequired,
    });
    if (Object.keys(errors).length) {
      setStatus('idle');
      setFieldErrors(errors);
      return;
    }

    setStatus('sending');
    setFieldErrors({});
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        fields?: Partial<Record<ContactField, ContactFieldIssue>>;
      };
      if (response.ok) {
        setStatus('success');
        setForm(initial);
        return;
      }
      if (payload.fields) {
        setFieldErrors(payload.fields);
        setStatus('idle');
        return;
      }
      setStatus('error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <form className="grid items-start gap-5 md:grid-cols-2" onSubmit={onSubmit} noValidate>
      <label className="grid items-start gap-2 text-sm">
        {label('form.lastName')} *
        <input className={inputClass('lastName')} name="lastName" autoComplete="family-name" required value={form.lastName} onChange={(e) => update('lastName', e.target.value)} aria-invalid={Boolean(fieldErrors.lastName)} />
        {fieldMessage('lastName') && <span className="text-red-800">{fieldMessage('lastName')}</span>}
      </label>
      <label className="grid items-start gap-2 text-sm">
        {label('form.firstName')}
        <input className="h-auto w-full self-start rounded-2xl border border-brand/20 bg-paper px-4 py-3 text-ink outline-none transition focus:border-brand" name="firstName" autoComplete="given-name" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
      </label>
      <label className="grid items-start gap-2 text-sm">
        {label('form.email')} *
        <input className={inputClass('email')} name="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => update('email', e.target.value)} aria-invalid={Boolean(fieldErrors.email)} />
        {fieldMessage('email') && <span className="text-red-800">{fieldMessage('email')}</span>}
      </label>
      <label className="grid items-start gap-2 text-sm">
        {label('form.phone')} *
        <input className={inputClass('phone')} name="phone" type="tel" autoComplete="tel" required value={form.phone} onChange={(e) => update('phone', e.target.value)} aria-invalid={Boolean(fieldErrors.phone)} />
        {fieldMessage('phone') && <span className="text-red-800">{fieldMessage('phone')}</span>}
      </label>
      {serviceRequired && (
      <label className="grid items-start gap-2 text-sm md:col-span-2">
        {label('form.service')} *
        <select
          className={`${inputClass('service')} cursor-pointer`}
          name="service"
          required={serviceRequired}
          value={form.service}
          onChange={(e) => update('service', e.target.value)}
          aria-invalid={Boolean(fieldErrors.service)}
        >
          <option value="">{label('form.servicePlaceholder')}</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.title}
            </option>
          ))}
        </select>
        {fieldMessage('service') && <span className="text-red-800">{fieldMessage('service')}</span>}
      </label>
      )}
      <label className="grid items-start gap-2 text-sm md:col-span-2">
        {label('form.message')} *
        <textarea className={`${inputClass('message')} min-h-36`} name="message" required value={form.message} onChange={(e) => update('message', e.target.value)} aria-invalid={Boolean(fieldErrors.message)} />
        {fieldMessage('message') && <span className="text-red-800">{fieldMessage('message')}</span>}
      </label>
      <div className="hidden" aria-hidden="true">
        <label>
          {label('form.honeypot')}
          <input name="companyUrl" tabIndex={-1} autoComplete="off" value={form.companyUrl} onChange={(e) => update('companyUrl', e.target.value)} />
        </label>
      </div>
      <div className="md:col-span-2">
        <button
          type="submit"
          className="rounded-full bg-brand px-7 py-3 text-sm font-semibold text-paper disabled:opacity-60"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? label('form.sending') : label('form.submit')}
        </button>
      </div>
      {status === 'success' && <p className="md:col-span-2 rounded-2xl bg-brand/10 px-4 py-3 text-brand" role="status">{label('form.success')}</p>}
      {status === 'error' && <p className="md:col-span-2 rounded-2xl bg-red-50 px-4 py-3 text-red-800" role="alert">{label('form.error')}</p>}
    </form>
  );
}
