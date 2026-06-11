import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('anas-ai-install-dismissed') === '1'
  );

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    if (isIos() && !isStandalone()) {
      setShowIosHint(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, [dismissed]);

  const dismiss = () => {
    localStorage.setItem('anas-ai-install-dismissed', '1');
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosHint(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') dismiss();
    setDeferredPrompt(null);
  };

  if (dismissed || isStandalone()) return null;
  if (!deferredPrompt && !showIosHint) return null;

  return (
    <div className="install-prompt fixed bottom-20 left-3 right-3 z-50 mx-auto max-w-md rounded-2xl border border-indigo-500/30 bg-gray-900/95 p-4 shadow-xl backdrop-blur-md dark:border-indigo-400/30">
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2 right-2 rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
        aria-label="إغلاق"
      >
        <X size={16} />
      </button>

      <p className="mb-3 pr-6 text-sm font-medium text-white">ثبّت Anas AI على هاتفك</p>

      {deferredPrompt ? (
        <button
          type="button"
          onClick={install}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          <Download size={18} />
          تثبيت التطبيق
        </button>
      ) : (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-300">
          <Share size={16} className="mt-0.5 shrink-0 text-indigo-400" />
          <span>
            في Safari: اضغط <strong>مشاركة</strong> ثم <strong>إضافة إلى الشاشة الرئيسية</strong>
          </span>
        </p>
      )}
    </div>
  );
}
