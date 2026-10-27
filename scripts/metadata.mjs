export const SITE_URL = 'https://guozhuyin.github.io';

export function canonicalURL(language, route, defaultLanguage) {
  const pathname = `/${language}/${route ? `${route}/` : ''}`;
  return new URL(pathname, SITE_URL).href;
}

export const absoluteAsset = file => new URL(`/${file}`, SITE_URL).href;

// Prevent user-editable text from closing the JSON-LD script element.
export const scriptJSON = value => JSON.stringify(value).replace(/</g, '\\u003c');
