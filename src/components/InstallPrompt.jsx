import { useEffect, useState } from 'react';

const DISMISS_KEY = 'thyrotrack_install_dismissed';

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !window.MSStream;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState(null); // 'android' | 'ios'

  useEffect(() => {
    if (isStandalone()) return undefined;
    if (sessionStorage.getItem(DISMISS_KEY)) return undefined;

    function onBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setMode('android');
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

    // beforeinstallprompt never fires on iOS Safari — show the manual
    // instructions instead, once per session.
    let iosTimer;
    if (isIOS()) {
      iosTimer = setTimeout(() => {
        setMode((m) => m || 'ios');
        setVisible((v) => v || true);
      }, 1500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      clearTimeout(iosTimer);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem(DISMISS_KEY, '1');
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (!visible || !mode) return null;

  return (
    <div className="install-banner">
      {mode === 'android' ? (
        <>
          <span className="install-banner-text">Install ThyroTrack on your home screen</span>
          <div className="install-banner-actions">
            <button className="install-banner-btn" onClick={handleInstall}>Install</button>
            <button className="install-banner-dismiss" onClick={dismiss} aria-label="Dismiss">&times;</button>
          </div>
        </>
      ) : (
        <>
          <span className="install-banner-text">Tap Share → Add to Home Screen to install</span>
          <button className="install-banner-dismiss" onClick={dismiss} aria-label="Dismiss">&times;</button>
        </>
      )}
    </div>
  );
}
