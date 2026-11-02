import type { MetaData } from "./types";

function rgbToHex(rgb: string): string {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return rgb;
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

export function getMetaDataFromTags(): MetaData {
  if (typeof document === 'undefined' || typeof document.getElementsByTagName !== 'function') {
    return {
      description: '',
      title: typeof document !== 'undefined' ? document.title || '' : '',
      colors: null,
    };
  }

  const metaTags = document.getElementsByTagName('meta');
  let description: string | null = null;
  let title: string | null = null;

  for (let i = 0; i < metaTags.length; i++) {
    const meta = metaTags[i];
    const name = meta.getAttribute?.('name');
    const content = meta.getAttribute?.('content');

    if (!name || !content) continue;

    switch (name.toLowerCase()) {
      case 'description':
        description = content;
        break;
      case 'title':
        title = content;
        break;
    }
  }

  let colors: MetaData['colors'] = null;
  if (document.body && typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
    try {
      const bodyStyles = window.getComputedStyle(document.body);
      const button = document.querySelector?.('button') ?? null;
      const buttonStyles = button ? window.getComputedStyle(button) : null;
      const buttonHoverStyles = button ? window.getComputedStyle(button, ':hover') : null;

      colors = {
        background: rgbToHex(bodyStyles.backgroundColor),
        text: rgbToHex(bodyStyles.color),
        primary: buttonStyles ? rgbToHex(buttonStyles.backgroundColor) : undefined,
        secondary:
          buttonHoverStyles && buttonHoverStyles.backgroundColor !== buttonStyles?.backgroundColor
            ? rgbToHex(buttonHoverStyles.backgroundColor)
            : buttonStyles
              ? rgbToHex(buttonStyles.backgroundColor)
              : undefined,
      };
    } catch {
      colors = null;
    }
  }

  return {
    description: description || '',
    title: title || document.title || '',
    colors,
  };
}
