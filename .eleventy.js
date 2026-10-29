const SITE = "https://agilecounseling.com";
const ORG = SITE + "/#organization";
const PERSON = SITE + "/#candice";
const WEBSITE = SITE + "/#website";
const GEO = { "@type": "GeoCoordinates", latitude: 40.5880, longitude: -111.8924 };
const NPI_URL = "https://npiregistry.cms.hhs.gov/provider-view/1376050237";
const CRUMB_LABEL = {
  services: ["Services", "/#services"],
  areas: ["Areas Served", "/#areas"],
  guides: ["Guides", "/#areas"],
  blog: ["Blog", "/blog/"],
};

function schemaGraph(url, title, description) {
  const pageUrl = SITE + url;
  const crumbs = [{ name: "Home", item: SITE + "/" }];
  const parts = url.split("/").filter(Boolean);
  if (parts.length === 2 && CRUMB_LABEL[parts[0]]) {
    const [label, href] = CRUMB_LABEL[parts[0]];
    crumbs.push({ name: label, item: SITE + href });
  }
  if (url !== "/") crumbs.push({ name: title, item: pageUrl });
  const graph = [
    {
      "@type": "CounselingService",
      "@id": ORG,
      name: "Agile Counseling",
      url: SITE + "/",
      image: SITE + "/images/og-image.jpg",
      telephone: "+1-801-597-9558",
      email: "candice@agilecounseling.com",
      address: { "@type": "PostalAddress", streetAddress: "45 W 9000 S, Ste 1", addressLocality: "Sandy", addressRegion: "UT", postalCode: "84070", addressCountry: "US" },
      geo: GEO,
      hasMap: "https://www.google.com/maps?q=45+W+9000+S+Ste+1,+Sandy,+UT+84070",
      areaServed: ["Sandy", "Draper", "Salt Lake City", "South Jordan", "West Jordan", "Herriman", "Murray"].map(n => ({ "@type": "City", name: n + ", UT" })),
      medicalSpecialty: "Psychiatric",
      identifier: { "@type": "PropertyValue", propertyID: "NPI", value: "1376050237" },
      sameAs: [NPI_URL],
      founder: { "@id": PERSON },
      employee: { "@id": PERSON },
      availableService: [
        ["Anxiety Therapy", "/services/anxiety-therapy/"],
        ["Depression Therapy", "/services/depression-therapy/"],
        ["Child & Teen Therapy", "/services/child-therapy/"],
        ["Family Counseling", "/services/family-counseling/"],
        ["EMDR Therapy", "/services/emdr-therapy/"],
        ["LGBTQIA+ Affirming Therapy", "/services/lgbtqia-affirming/"],
      ].map(([name, path]) => ({ "@type": "MedicalTherapy", name, url: SITE + path })),
    },
    {
      "@type": "Person",
      "@id": PERSON,
      name: "Candice Gonzalez",
      honorificSuffix: "LCSW",
      jobTitle: "Licensed Clinical Social Worker",
      worksFor: { "@id": ORG },
      url: SITE + "/about/",
      image: SITE + "/images/candice-gonzalez.jpg",
      sameAs: [NPI_URL],
    },
    { "@type": "WebSite", "@id": WEBSITE, url: SITE + "/", name: "Agile Counseling", publisher: { "@id": ORG }, inLanguage: "en-US" },
    {
      "@type": "WebPage",
      "@id": pageUrl + "#webpage",
      url: pageUrl,
      name: title,
      description,
      isPartOf: { "@id": WEBSITE },
      about: { "@id": ORG },
      breadcrumb: { "@id": pageUrl + "#breadcrumb" },
      inLanguage: "en-US",
    },
    {
      "@type": "BreadcrumbList",
      "@id": pageUrl + "#breadcrumb",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.item })),
    },
  ];
  return '<script type="application/ld+json">\n' + JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2) + "\n</script>";
}

module.exports = function(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/llms.txt");
  eleventyConfig.addPassthroughCopy("src/llms-full.txt");
  eleventyConfig.addPassthroughCopy({ "static": "/" });
  eleventyConfig.addPassthroughCopy("src/favicon.svg");
  eleventyConfig.addPassthroughCopy("src/favicon-32.png");
  eleventyConfig.addPassthroughCopy("src/apple-touch-icon.png");
  eleventyConfig.addPassthroughCopy("src/manifest.json");
  eleventyConfig.addPassthroughCopy("src/.well-known");

  // Date filter for sitemap
  eleventyConfig.addFilter('date', (date, format) => {
    const d = new Date(date);
    if (format === '%Y-%m-%d') {
      return d.toISOString().split('T')[0];
    }
    return d.toISOString();
  });

  // One shared schema graph (organisation, therapist, website, page, breadcrumb) for every page.
  eleventyConfig.addFilter("schemaGraph", schemaGraph);

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
