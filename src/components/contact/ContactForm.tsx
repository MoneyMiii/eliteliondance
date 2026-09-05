import { useState, type FormEvent, type ReactNode } from 'react';
import { t, type Labels } from '../../lib/i18n';
import { contactFieldErrors, type ContactField, type ContactFieldIssue } from '../../lib/contact-validation';
import { useLiveLabels, useLiveSlice } from '../../lib/use-live-i18n';

interface ContactServiceOption {
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

function inputClass(invalid?: boolean) {
  return [
    'h-auto w-full self-start rounded-2xl border bg-paper px-4 py-3 text-ink outline-none transition focus:border-brand',
    invalid ? 'border-red-700' : 'border-brand/20',
  ].join(' ');
}

function Field({
  label,
  error,
  className = '',
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`grid items-start gap-2 text-sm ${className}`}>
      {label}
      {children}
      {error && <span className="text-red-800">{error}</span>}
    </label>
  );
}

export default function ContactForm({ labels, services }: Props) {
  const liveLabels = useLiveLabels(labels);
  const liveServices = useLiveSlice('contactServices', services);
  const [form, setForm] = useState<FormState>(initial);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ContactField, ContactFieldIssue>>>({});
  const serviceRequired = liveServices.length > 0;

  function label(key: string): string {
    return t(liveLabels, key) || FALLBACK[key] || '';
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
      <Field label={`${label('form.lastName')} *`} error={fieldMessage('lastName')}>
        <input className={inputClass(Boolean(fieldErrors.lastName))} name="lastName" autoComplete="family-name" required value={form.lastName} onChange={(e) => update('lastName', e.target.value)} aria-invalid={Boolean(fieldErrors.lastName)} />
      </Field>
      <Field label={label('form.firstName')}>
        <input className={inputClass()} name="firstName" autoComplete="given-name" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
      </Field>
      <Field label={`${label('form.email')} *`} error={fieldMessage('email')}>
        <input className={inputClass(Boolean(fieldErrors.email))} name="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => update('email', e.target.value)} aria-invalid={Boolean(fieldErrors.email)} />
      </Field>
      <Field label={`${label('form.phone')} *`} error={fieldMessage('phone')}>
        <input className={inputClass(Boolean(fieldErrors.phone))} name="phone" type="tel" autoComplete="tel" required value={form.phone} onChange={(e) => update('phone', e.target.value)} aria-invalid={Boolean(fieldErrors.phone)} />
      </Field>
      {serviceRequired && (
        <Field label={`${label('form.service')} *`} error={fieldMessage('service')} className="md:col-span-2">
          <select
            className={`${inputClass(Boolean(fieldErrors.service))} cursor-pointer`}
            name="service"
            required={serviceRequired}
            value={form.service}
            onChange={(e) => update('service', e.target.value)}
            aria-invalid={Boolean(fieldErrors.service)}
          >
            <option value="">{label('form.servicePlaceholder')}</option>
            {liveServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label={`${label('form.message')} *`} error={fieldMessage('message')} className="md:col-span-2">
        <textarea className={`${inputClass(Boolean(fieldErrors.message))} min-h-36`} name="message" required value={form.message} onChange={(e) => update('message', e.target.value)} aria-invalid={Boolean(fieldErrors.message)} />
      </Field>
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
