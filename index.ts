import { BearbyProviderImpl } from './src/bearby-provider';
import { announceProvider, setupTIP6963RequestListener } from './src/tip6963';

export * from './src/types';
export * from './src/bearby-provider';
export * from './src/tip6963';

(async function() {
  console.log('[BearbyTron] IIFE start');

  if (typeof window === 'undefined' || !window) {
    console.log('[BearbyTron] No window object — aborting injection');
    console.warn('No window object available for Bearby injection');
    return;
  }

  if ((window as any).__bearbyTronInjected) {
    console.log('[BearbyTron] Already injected — re-announcing');
    if ((window as any).tron) {
      announceProvider((window as any).tron);
    }
    return;
  }

  try {
    console.log('[BearbyTron] Creating BearbyProviderImpl');
    const provider = new BearbyProviderImpl();
    const tronProvider = provider.getProvider();
    console.log('[BearbyTron] Provider created');

    if (!('tron' in window) || !window.tron) {
      try {
        Object.defineProperty(window, 'tron', {
          value: tronProvider,
          writable: false,
          configurable: true,
        });
        console.log('[BearbyTron] window.tron assigned via defineProperty');
      } catch (defineError) {
        (window as any).tron = tronProvider;
        console.log('[BearbyTron] window.tron assigned via fallback');
        console.warn('Using fallback assignment for tron due to:', defineError);
      }
    }

    if (!('tronLink' in window) || !window.tronLink) {
      try {
        Object.defineProperty(window, 'tronLink', {
          value: tronProvider,
          writable: false,
          configurable: true,
        });
        console.log('[BearbyTron] window.tronLink assigned via defineProperty');
      } catch (defineError) {
        (window as any).tronLink = tronProvider;
        console.log('[BearbyTron] window.tronLink assigned via fallback');
      }
    }

    if (!('tronWeb' in window) || !window.tronWeb) {
      try {
        Object.defineProperty(window, 'tronWeb', {
          get: () => provider.tronWeb,
          configurable: true,
        });
        console.log('[BearbyTron] window.tronWeb assigned via defineProperty (getter)');
      } catch (defineError) {
        (window as any).tronWeb = provider.tronWeb;
        console.log('[BearbyTron] window.tronWeb assigned via fallback');
      }
    }

    (window as any).__bearby_response_handlers = (window as any).__bearby_response_handlers || {};
    (window as any).__bearbyTronInjected = true;

    // TIP-6963 provider discovery — register listener before init so dApps can request provider
    setupTIP6963RequestListener(tronProvider);
    announceProvider(tronProvider);
    console.log('[BearbyTron] TIP-6963 provider announced');

    // Await init so window.tronWeb.defaultAddress is populated before tronLink#initialized fires.
    // dApps that listen with { once: true } will read the correct address on the first event.
    console.log('[BearbyTron] Calling provider.init() — awaiting...');
    await provider.init();
    console.log('[BearbyTron] provider.init() complete, tronWeb.defaultAddress=' + JSON.stringify((window as any).tronWeb?.defaultAddress));

    window.dispatchEvent(new Event('tron#initialized'));
    console.log('[BearbyTron] tron#initialized event dispatched');
    window.dispatchEvent(new Event('tronlink#initialized'));
    window.dispatchEvent(new Event('tronLink#initialized'));
    console.log('[BearbyTron] tronlink#initialized / tronLink#initialized events dispatched');
  } catch (error) {
    try {
      console.log('[BearbyTron] IIFE catch error: ' + JSON.stringify(error));
    } catch (_) {
      console.log('[BearbyTron] IIFE catch error (non-serializable)');
    }
    console.error('Failed to inject Tron provider:', error);
  }
})();
