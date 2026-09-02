import { access, readFile, writeFile } from "node:fs/promises";

const projects = [
  {
    slug: "kicksjoint",
    file: "kicksjoint.html",
    title: "Kicksjoint",
    caseNo: "01",
    tags: ["Branding", "Experience", "Commerce"],
    description: "A culture-led identity built for campaigns, commerce and community.",
    hero: "assets/img/picture/kicksjoint/kjbg.png",
    thumbs: ["assets/img/kj1.png", "assets/img/kj5.png", "assets/img/case2.png"]
  },
  {
    slug: "ademi",
    file: "ademi.html",
    title: "Ademi",
    caseNo: "02",
    tags: ["Branding", "Art direction"],
    description: "An expressive identity system built to give Ademi a confident rhythm across campaigns, product moments and digital storytelling.",
    hero: "assets/img/picture/ademi/bg1.png",
    story: { type: "video", src: "assets/video/ademi.mp4", poster: "assets/img/picture/ademi/bg1.png", label: "Identity in motion" },
    gallery: ["6.png", "1.png", "2.png", "3.png", "7.png", "8.png", "9.png", "10.png", "11b.png", "12.png", "13.png", "14.png", "16.png", "20.png", "22.png"].map(name => `assets/img/picture/ademi/${name}`),
    thumbs: ["assets/img/ademi1.png", "assets/img/ademi2.png", "assets/img/ademi3.png"]
  },
  {
    slug: "enterscale",
    file: "enterscale.html",
    title: "EnterScale",
    caseNo: "03",
    tags: ["Strategy", "Branding"],
    description: "A strategy-led identity for a growth partner, translating operational clarity into a sharp and scalable brand system.",
    hero: "assets/img/picture/enterscale/into.png",
    story: { type: "image", src: "assets/img/picture/enterscale/1.png", label: "Growth made visible" },
    gallery: ["1b.png", "left2.png", "right.png", "4.png", "10.png", "5.png", "13.png", "7.png", "left1b.png", "9.png", "left.png", "16.png", "10b.png"].map(name => `assets/img/picture/enterscale/${name}`),
    thumbs: ["assets/img/picture/enterscale/1.png", "assets/img/picture/enterscale/right.png", "assets/img/picture/enterscale/3.png"]
  },
  {
    slug: "vatug",
    file: "vatug.html",
    title: "VatuG",
    caseNo: "04",
    tags: ["Identity", "Digital"],
    description: "A digital-first identity with a strong product edge, designed to communicate trust, momentum and technical ambition.",
    hero: "assets/img/picture/vatug/bg.png",
    story: { type: "image", src: "assets/img/picture/vatug/1.png", label: "Digital identity system" },
    gallery: ["2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png", "9.png", "10.png", "11.png", "12.png", "13.png", "14.png", "left.png", "right.png"].map(name => `assets/img/picture/vatug/${name}`),
    thumbs: ["assets/img/vatug.png", "assets/img/vatug2.png", "assets/img/vatug3.png"]
  },
  {
    slug: "dsl",
    file: "dsl.html",
    title: "Doorstep Logistics",
    caseNo: "05",
    tags: ["Product", "Experience"],
    description: "A logistics identity and product interface shaped around speed, reliability and a cleaner customer experience.",
    hero: "assets/img/picture/dsl/bg.png",
    story: { type: "image", src: "assets/img/picture/dsl/ui.png", label: "Product experience" },
    gallery: ["laptop.png", "bg.png", "pg1.png", "pg3.png", "Artboard 1-01.png", "Artboard 1-02.png", "Artboard 1-03.png", "21.png", "22.png", "bg1.png", "Artboard 1.png"].map(name => `assets/img/picture/dsl/${name}`),
    thumbs: ["assets/img/picture/dsl/Artboard22.png", "assets/img/picture/dsl/ui.png", "assets/img/picture/dsl/21.png"]
  },
  {
    slug: "tyol",
    file: "tyol.html",
    title: "TYOL",
    caseNo: "06",
    tags: ["Campaign", "Content"],
    description: "A campaign system for The Year of Love, created to carry emotional storytelling across content, visuals and launch moments.",
    hero: "assets/img/picture/tyol/bg.png",
    story: { type: "video", src: "assets/video/tyol.mp4", poster: "assets/img/picture/tyol/bg.png", label: "Campaign in motion" },
    gallery: ["bg2.png", "side1.png", "1a.png", "1.png", "13.png", "3.png", "9.png", "2a.png", "1bd.png", "10a.png", "2c.png", "2b.png", "2f.png", "12.png", "7.png"].map(name => `assets/img/picture/tyol/${name}`),
    thumbs: ["assets/img/tyol.png", "assets/img/picture/tyol/side1.png", "assets/img/picture/tyol/3.png"]
  },
  {
    slug: "bpm",
    file: "bpm.html",
    title: "Beat Per Minute",
    caseNo: "07",
    tags: ["Branding", "Music"],
    description: "A music-led identity with a flexible visual rhythm for digital experiences, events and community touchpoints.",
    hero: "assets/img/bpm.png",
    story: { type: "video", src: "assets/video/bpm.mp4", poster: "assets/img/bpm.png", label: "Rhythm in motion" },
    gallery: ["assets/img/bpm2.png", "assets/img/dj1.png", "assets/img/dj2.png", "assets/img/bpmjjj.png", "assets/img/bpm1.png", "assets/img/bpm.png"],
    thumbs: ["assets/img/bpm2.png", "assets/img/dj1.png", "assets/img/dj2.png"]
  }
];

const template = await readFile("kicksjoint.html", "utf8");
const footer = template.match(/      <footer class="cs-footer"[\s\S]*?      <\/footer>/)?.[0];
if (!footer) throw new Error("Could not locate canonical case-study footer in kicksjoint.html");

for (const project of projects.filter(item => item.slug !== "kicksjoint")) {
  const assets = [project.hero, project.story.src, project.story.poster, ...project.gallery, ...project.thumbs].filter(Boolean);
  for (const asset of assets) await access(asset);
}

const escapeHtml = value => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const tagList = (tags, label = "Project disciplines") => `<ul class="cs-tags" aria-label="${escapeHtml(label)}">${tags.map(tag => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>`;

function storyMedia(project) {
  const story = project.story;
  if (story.type === "video") {
    return `<video autoplay muted loop playsinline preload="metadata" poster="${story.poster}">
            <source src="${story.src}" type="video/mp4">
          </video>`;
  }
  return `<img src="${story.src}" alt="${escapeHtml(project.title)} ${escapeHtml(story.label.toLowerCase())}" loading="eager" decoding="async">`;
}

function galleryMarkup(project) {
  const rows = [];
  const images = [...project.gallery];
  const first = images.shift();
  rows.push({ type: "feature", images: [first] });
  while (images.length > 1) rows.push({ type: "pair", images: images.splice(0, 2) });
  if (images.length) rows.push({ type: "feature", images });

  let index = 1;
  return rows.map(row => `        <div class="cs-gallery__row cs-gallery__row--${row.type}">
${row.images.map(src => {
    const itemIndex = String(index++).padStart(2, "0");
    return `          <figure>
            <img src="${src}" alt="${escapeHtml(project.title)} project visual ${itemIndex}" loading="${itemIndex === "01" ? "eager" : "lazy"}" decoding="async">
          </figure>`;
  }).join("\n")}
        </div>`).join("\n\n");
}

function relatedMarkup(project) {
  const currentIndex = projects.findIndex(item => item.slug === project.slug);
  const related = [];
  for (let offset = 1; related.length < 3; offset += 1) {
    const candidate = projects[(currentIndex + offset) % projects.length];
    if (candidate.slug !== project.slug) related.push(candidate);
  }
  return related.map(item => `          <a class="cs-related-row" href="${item.file}">
            <h2>${escapeHtml(item.title)}</h2>
            ${tagList(item.tags, `${item.title} disciplines`)}
            <span class="cs-related-row__view">( View + )</span>
            <span class="cs-related-row__rail" aria-hidden="true">
${item.thumbs.map(src => `              <img src="${src}" alt="" loading="lazy" decoding="async">`).join("\n")}
            </span>
          </a>`).join("\n");
}

function mainMarkup(project) {
  return `    <main id="main-content">
      <section class="cs-hero" aria-labelledby="cs-title" data-ll-section-note="${escapeHtml(project.title)} / Case ${project.caseNo}">
        <h1 class="cs-title" id="cs-title">${escapeHtml(project.title)}</h1>
        <div class="cs-hero__meta">
          ${tagList(project.tags)}
          <a class="cs-jump ll-button" href="#gallery">
            <span>View project</span>
            <svg class="ll-icon ll-icon--sm ll-icon--arrow-down" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"></path><path d="m6 13 6 6 6-6"></path></svg>
          </a>
        </div>
      </section>

      <section class="cs-story" aria-label="Project overview" data-ll-section-note="Project story">
        <p class="cs-story__copy ll-reveal">${escapeHtml(project.description)}</p>
        <figure class="cs-story__media ll-reveal">
          ${storyMedia(project)}
        </figure>
      </section>

      <section class="cs-gallery" id="gallery" aria-label="${escapeHtml(project.title)} project gallery" data-ll-section-note="Visual system">
${galleryMarkup(project)}
      </section>

      <section class="cs-related" aria-labelledby="related-title" data-ll-section-note="Related work">
        <div class="cs-related__head">
          <p id="related-title">[ Related work ]</p>
          <a href="work.html"><span>View all work</span><svg class="ll-icon ll-icon--sm ll-icon--plus" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg></a>
        </div>
        <div class="cs-related-list">
${relatedMarkup(project)}
        </div>
      </section>

${footer}
    </main>`;
}

for (const project of projects.filter(item => item.slug !== "kicksjoint")) {
  const pageTitle = `${project.title} — Lawani St`;
  const publicImage = `https://lawanistreet.com/${project.hero}`;
  let html = template
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(project.description)}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(pageTitle)}</title>`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="https://lawanistreet.com/${project.file}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(pageTitle)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(project.description)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="https://lawanistreet.com/${project.file}">`)
    .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${publicImage}">`)
    .replace(/\s*<meta property="og:image:width"[^>]*>/, "")
    .replace(/\s*<meta property="og:image:height"[^>]*>/, "")
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escapeHtml(pageTitle)}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escapeHtml(project.description)}">`)
    .replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${publicImage}">`)
    .replace(/<body class="case-study case-study--[^"]+">/, `<body class="case-study case-study--${project.slug}">`)
    .replace(/    <main id="main-content">[\s\S]*?    <\/main>/, mainMarkup(project));

  await writeFile(project.file, html);
}

console.log(`Built ${projects.length - 1} case-study pages from kicksjoint.html`);
