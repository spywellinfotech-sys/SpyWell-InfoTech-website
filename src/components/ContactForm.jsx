import { useState } from 'react';
import { CheckCircle2, AlertCircle, Mail, MessageCircle } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { SITE, mailLink, whatsappLink } from '../data/site';
import { services } from '../data/content';

const initial = { name: '', company: '', email: '', phone: '', country: '', service: '', budget: '', message: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\d][\d\s()+-]{6,19}$/;

export default function ContactForm() {
  const { t, tr, lang } = useLang();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  // status: idle | sending | success | error | notConnected
  const [status, setStatus] = useState('idle');

  const f = (k) => t(`contact.fields.${k}`);

  const validate = (v) => {
    const e = {};
    ['name', 'email', 'phone', 'country', 'service', 'message'].forEach((k) => {
      if (!v[k].trim()) e[k] = t('contact.required');
    });
    if (v.email.trim() && !EMAIL_RE.test(v.email.trim())) e.email = t('contact.invalidEmail');
    if (v.phone.trim() && !PHONE_RE.test(v.phone.trim())) e.phone = t('contact.invalidPhone');
    if (v.message.trim() && v.message.trim().length < 20) e.message = t('contact.shortMessage');
    return e;
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  // Service is stored as a slug so the choice survives a language switch.
  const serviceName = () => {
    const s = services.find((x) => x.slug === values.service);
    return s ? s.title.en : values.service === 'other' ? 'Other / Not sure yet' : '';
  };

  const summaryText = () =>
    [
      `${f('name')}: ${values.name}`,
      `${f('company')}: ${values.company || '-'}`,
      `${f('email')}: ${values.email}`,
      `${f('phone')}: ${values.phone}`,
      `${f('country')}: ${values.country}`,
      `${f('service')}: ${serviceName()}`,
      `${f('budget')}: ${values.budget || '-'}`,
      '',
      values.message,
    ].join('\n');

  const onSubmit = async (e) => {
    e.preventDefault();
    const eMap = validate(values);
    setErrors(eMap);
    if (Object.keys(eMap).length) {
      setStatus('idle');
      const first = Object.keys(eMap)[0];
      document.getElementById(`cf-${first}`)?.focus();
      return;
    }

    // No form service configured: do NOT pretend the message was delivered.
    if (!SITE.formEndpoint) {
      setStatus('notConnected');
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch(SITE.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ _subject: 'New enquiry from SpyWell InfoTech website', _captcha: 'false', ...values, service: serviceName(), language: lang }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('success');
      setValues(initial);
    } catch {
      setStatus('error');
    }
  };

  const base =
    'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-slate-400 focus:border-electric-500 focus:outline-none focus:ring-2 focus:ring-electric-500/30';

  const field = (key, { type = 'text', optional = false, as, children, autoComplete } = {}) => {
    const id = `cf-${key}`;
    const err = errors[key];
    const common = {
      id, name: key, value: values[key], onChange,
      'aria-invalid': err ? 'true' : 'false',
      'aria-describedby': err ? `${id}-err` : undefined,
      className: `${base} ${err ? 'border-red-500' : 'border-navy-100'}`,
      required: !optional,
      autoComplete,
    };
    return (
      <div className={key === 'message' ? 'sm:col-span-2' : ''}>
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-navy-800">
          {f(key)} {!optional && <span aria-hidden="true" className="text-red-500">*</span>}
        </label>
        {as === 'select' ? (
          <select {...common}>{children}</select>
        ) : as === 'textarea' ? (
          <textarea {...common} rows={5} placeholder={t('contact.placeholders.message')} />
        ) : (
          <input {...common} type={type} placeholder={t(`contact.placeholders.${key}`)} />
        )}
        {err && <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-red-600">{err}</p>}
      </div>
    );
  };

  const hasErrors = Object.values(errors).some(Boolean);
  const budgets = t('contact.budgets');

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-2xl font-bold text-navy-800">{t('contact.formTitle')}</h2>

      {hasErrors && (
        <p role="alert" className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} aria-hidden="true" /> {t('contact.errorSummary')}
        </p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {field('name', { autoComplete: 'name' })}
        {field('company', { optional: true, autoComplete: 'organization' })}
        {field('email', { type: 'email', autoComplete: 'email' })}
        {field('phone', { type: 'tel', autoComplete: 'tel' })}
        {field('country', { autoComplete: 'country-name' })}
        {field('service', {
          as: 'select',
          children: (
            <>
              <option value="">{t('contact.selectService')}</option>
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>{tr(s.title)}</option>
              ))}
              <option value="other">{t('contact.other')}</option>
            </>
          ),
        })}
        {field('budget', {
          as: 'select', optional: true,
          children: (
            <>
              <option value="">{t('contact.selectBudget')}</option>
              {Array.isArray(budgets) && budgets.map((b) => <option key={b} value={b}>{b}</option>)}
            </>
          ),
        })}
        {field('message', { as: 'textarea' })}
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-electric-500 px-6 py-3 font-semibold text-white transition hover:bg-electric-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-500 focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto"
      >
        {status === 'sending' ? t('contact.sending') : t('contact.submit')}
      </button>

      <div aria-live="polite" className="mt-5">
        {status === 'success' && (
          <p className="flex items-start gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" /> {t('contact.success')}
          </p>
        )}
        {status === 'error' && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" /> {t('contact.error')}
          </p>
        )}
        {status === 'notConnected' && (
          <div className="rounded-lg bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <p className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" /> {t('contact.notConnected')}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <a href={whatsappLink(`${t('contact.waGreeting')}\n\n${summaryText()}`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 font-semibold text-white">
                <MessageCircle size={16} aria-hidden="true" /> {t('contact.sendWhatsapp')}
              </a>
              <a href={mailLink(t('contact.mailSubject')) + `&body=${encodeURIComponent(summaryText())}`} className="inline-flex items-center gap-2 rounded-full bg-navy-800 px-4 py-2 font-semibold text-white">
                <Mail size={16} aria-hidden="true" /> {t('contact.sendEmail')}
              </a>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
