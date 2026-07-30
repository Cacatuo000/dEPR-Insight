export default function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "dEPR Insight",
    applicationCategory: "ScienceApplication",
    operatingSystem: "Web Browser",
    description:
      "Simulation and interpretation of d-orbital EPR spectra for transition metal complexes. Compute g-factors, hyperfine splitting, zero-field splitting, and powder spectra.",
    url: "https://depr-insight.pages.dev",
    author: {
      "@type": "Person",
      name: "Sharon Bernardi",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    browserRequirements: "Requires JavaScript",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
