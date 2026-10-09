/**
 * Universal deep-link sharing utility for Gyani.
 * Copies the permanent hash URL to the clipboard and optionally triggers
 * the native mobile share sheet when supported.
 */
export async function copyShareLink(type, identifier, title = '') {
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  const hash = `#${type}=${encodeURIComponent(identifier)}`;
  const fullUrl = `${origin}${pathname}${hash}`;

  let copied = false;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(fullUrl);
      copied = true;
    }
  } catch (err) {
    console.warn('Clipboard writeText failed, trying fallback:', err);
  }

  if (!copied) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = fullUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      copied = true;
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
  }

  // If user is on a mobile device and Web Share API is available, offer native share
  if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
    try {
      await navigator.share({
        title: title ? `${title} • Gyani` : 'Gyani Archive',
        text: title ? `Check out "${title}" on Gyani:` : 'Explore on Gyani:',
        url: fullUrl
      });
    } catch (err) {
      // User cancelled share dialog or dismissed, perfectly normal
    }
  }

  return { copied, url: fullUrl };
}
