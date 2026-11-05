import { MessageCircle } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { whatsappLink } from '../data/site';

export default function WhatsAppFloat() {
  const { t } = useLang();
  return (
    <a
      href={whatsappLink(t('contact.waGreeting'))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('common.whatsapp')}
      className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40"
    >
      <MessageCircle size={28} aria-hidden="true" />
    </a>
  );
}
