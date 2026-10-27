import {escapeHTML as e} from './content.mjs';

// Shared layout components use the same editable content as the local editor.
export function header({brandIcon, name, home, navigation, languages, languageLabel, theme, themeIcons}) {
  const current = languages.find(language => language.current) || languages[0];
  return `<header class="site-header"><div class="header-inner">
    <a class="brand" href="${home}">${brandIcon}<span translate="no">${name}</span></a>
    <nav class="main-navigation" aria-label="${e(navigation.label)}">${navigation.items.map(item => `<a href="${item.href}"${item.current ? ' aria-current="page"' : ''}>${e(item.label)}</a>`).join('')}</nav>
    <div class="preferences"><details class="language-picker"><summary title="${e(languageLabel)}"><span lang="${e(current.locale)}" translate="no">${e(current.label)}</span><span aria-hidden="true"> ▾</span></summary><ul>${languages.map(language => `<li><a href="${language.href}" data-language-link="${e(language.id)}" lang="${e(language.locale)}" hreflang="${e(language.locale)}" translate="no"${language.current ? ' aria-current="true"' : ''}>${e(language.label)}</a></li>`).join('')}</ul></details>
    <button class="theme-toggle" type="button" data-theme-toggle data-light-label="${e(theme.light)}" data-dark-label="${e(theme.dark)}" data-system-label="${e(theme.system)}" aria-label="${e(theme.label)}" aria-pressed="false" hidden><span data-theme-icon aria-hidden="true">${themeIcons}</span></button></div>
  </div></header>`;
}

export function footer({name, note, contact, socials, toTop}) {
  return `<footer class="site-footer">
    <div class="footer-signature"><span translate="no">${name}</span><p>${e(note)}</p></div>
    <div class="footer-main">${contact}<div class="social-links">${socials}</div></div>
    <a class="top-link" href="#top">${e(toTop)} <span aria-hidden="true">↑</span></a>
  </footer>`;
}

export function home({p, c, tx, quote, href, ext, picture, cards, resume, summaryLanguage, fileIcon}) {
  return `<section class="hero wrap">
    <div class="hero-heading"><div class="hero-copy">
      <p class="eyebrow hero-focus">${tx(p.focus)}</p>
      <h1 class="personal-name"><span>${tx(p.name)}</span></h1>
      <p class="hero-intro">${tx(p.intro).replace(/\n/g, '<br>')}</p>
    </div>${p.photo ? `<aside class="hero-aside">${picture(p.photo, p.photoAlt, 'portrait', 'eager')}</aside>` : ''}</div>
    <p class="hero-description" lang="${e(summaryLanguage)}">${tx(p.summary)}</p>
    ${quote()}
    <div class="hero-actions"><a class="text-link" href="#work-heading">${e(c.work)} <span aria-hidden="true">↓</span></a>${ext(resume, `${fileIcon}<span>${e(c.resume)}</span>`, 'text-link resume-link')}</div>
  </section>
  <section class="section wrap home-work" aria-labelledby="work-heading">
    <div class="section-heading"><div><p class="eyebrow">01 / ${e(c.work)}</p><h2 id="work-heading">${e(c.workIntro)}</h2></div><a class="text-link" href="${href('projects')}">${e(c.all)} ↗</a></div>
    <div class="project-grid">${cards}</div>
  </section>
  <section class="about-strip"><div class="wrap about-strip-inner"><p class="eyebrow">02 / ${e(c.about)}</p><div><h2>${e(c.aboutHeading).replace(/\n/g, '<br>')}</h2><p>${e(c.aboutIntro)}</p></div></div></section>
  <section class="section wrap home-writing"><div class="section-heading"><div><p class="eyebrow">03 / ${e(c.writing)}</p><h2>${e(c.writingIntro)}</h2></div><a class="text-link" href="${href('writing')}">${e(c.nav[3])} ↗</a></div><p class="writing-summary">${e(c.writingSummary)}</p></section>`;
}

export function projectCards({items, heading, href, picture, tx, tags, roleLabel, showTags=true}) {
  return items.map((project, index) => `<article class="project-card${project.cover ? ' has-cover' : ' no-cover'}">
    <div class="project-copy"><p class="eyebrow">${tx(project.category)}</p><h${heading}><a href="${href(`projects/${project.id}`)}">${tx(project.title)}<span aria-hidden="true"> ↗</span></a></h${heading}><p class="project-summary">${tx(project.summary)}</p>${tx(project.role) ? `<p class="card-role"><strong>${e(roleLabel)}:</strong> ${tx(project.role)}</p>` : ''}${showTags && project.tags?.length ? tags(project.tags) : ''}</div>
    ${project.cover ? `<a class="project-art" href="${href(`projects/${project.id}`)}" tabindex="-1" aria-hidden="true">${picture(project.cover, project.coverAlt)}</a>` : `<span class="project-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>`}
  </article>`).join('');
}
