/* Only the neutral entry page negotiates language; explicit page URLs stay put. */
(() => {
  const element = document.getElementById('language-config');
  if (!element) return;
  let config;
  try { config = JSON.parse(element.textContent); } catch { return; }
  const languages = config.languages;
  if (!Array.isArray(languages) || !languages.length) return;

  const parse = tag => {
    try { return new Intl.Locale(tag); } catch { return null; }
  };
  function selectLanguage(preferences) {
    for (const tag of preferences) {
      const requested = parse(tag);
      if (!requested) continue;
      const expanded = requested.maximize();
      let best = null, bestScore = -1;
      for (const available of languages) {
        const locale = parse(available.locale);
        if (!locale || requested.language !== locale.language) continue;
        const candidate = locale.maximize();
        const score =
          (requested.toString() === locale.toString() ? 100 : 0) +
          (tag.toLowerCase() === available.id.toLowerCase() ? 80 : 0) +
          (expanded.script === candidate.script ? 20 : 0) +
          (expanded.region === candidate.region ? 10 : 0);
        if (score > bestScore) { best = available; bestScore = score; }
      }
      if (best) return best;
    }
    return languages.find(language => parse(language.locale)?.language === 'en') || languages[0];
  }

  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[data-language-link]');
    if (!link || !languages.some(language => language.id === link.dataset.languageLink)) return;
    try { localStorage.setItem('mypage-language', link.dataset.languageLink); } catch {}
  });

  if (!config.entry) return;
  let selected;
  try { selected = languages.find(language => language.id === localStorage.getItem('mypage-language')); } catch {}
  selected ||= selectLanguage(navigator.languages?.length ? navigator.languages : [navigator.language]);
  const destination = new URL(selected.href, location.href);
  destination.search = location.search;
  destination.hash = location.hash;
  if (destination.href !== location.href) location.replace(destination.href);
})();
