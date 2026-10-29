import Image from "next/image";
import GalleryCarousel from "./gallery-carousel";

const contact = {
  phone: "07594 780797",
  phoneHref: "tel:+447594780797",
  whatsapp: "https://wa.me/447594780797",
  facebook: "https://facebook.com/Gberrisdetails",
  instagram: "https://instagram.com/gb_detaling",
  tiktok: "https://tiktok.com/@gb_details",
};

const services = [
  {
    title: "Valeting",
    id: "valeting",
    intro: "Careful cleaning for the inside, outside and everything in between.",
    items: [
      ["Wash & Vacuum", "From £35"],
      ["Exterior Valet", "From £25"],
      ["Interior Valet", "From £30"],
      ["Mini Valet", "From £45"],
      ["End of Lease / Full Valet", "From £100"],
    ],
  },
  {
    title: "Paint Protection",
    id: "paint-protection",
    intro: "A considered finish for paintwork, from hand polishing to protective treatments.",
    items: [
      ["Hand Polish", "From £60"],
      ["Tar Removal", "From £20"],
      ["Iron Fallout Removal", "From £25"],
      ["Spray Ceramic Protection", "From £30"],
    ],
  },
  {
    title: "Extras",
    id: "extras",
    intro: "Additional care for the details that need a little more attention.",
    items: [
      ["Seat Shampoo", "From £30"],
      ["Leather Treatment", "From £30"],
      ["Pet Hair Removal", "From £25"],
      ["Engine Bay Detail", "From £30"],
    ],
  },
];

const faqs = [
  {
    question: "How do I arrange a valet?",
    answer: "Call or WhatsApp GB Detailing on 07594 780797. Share your vehicle, the service you’re interested in and your location, and we’ll discuss a suitable time.",
  },
  {
    question: "How do vehicle sizes affect the price?",
    answer: "Small vehicles are included in the starting price. Medium vehicles are +£5 and large vehicles are +£10. Vehicle condition and any additional work can also affect the final quote; we’ll agree any change with you before starting.",
  },
  {
    question: "How long does a full valet take?",
    answer: "An End of Lease / Full Valet can take up to five hours. The time depends on the vehicle and its condition; we’ll discuss expectations when you enquire.",
  },
  {
    question: "Which areas do you cover?",
    answer: "GB Detailing covers Ramsey, Huntingdon, St Ives, Peterborough, Cambridge and surrounding areas. Get in touch to check your location.",
  },
  {
    question: "Are the prices fixed?",
    answer: "Prices are shown as starting prices. Vehicle size, condition and the work required can affect the final quote. We’ll confirm any change with you before work begins.",
  },
];

function Arrow() {
  return <span aria-hidden="true" className="arrow">↗</span>;
}

export default function Home() {
  return (
    <main>
      <div className="topline">
        <span className="topline-dot" />
        MOBILE DETAILING · CAMBRIDGE & SURROUNDING AREAS
        <span className="topline-right">CARE · CRAFT · FINISH</span>
      </div>

      <header className="site-header">
        <a className="brand" href="#home" aria-label="GB Detailing home">
          <Image src="/images/gb-logo-2026.webp" alt="GB Detailing" width={200} height={98} priority />
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#services">Services</a>
          <a href="#pricing">Pricing</a>
          <a href="#gallery">Gallery</a>
          <a href="#about">About</a>
          <a href="#faqs">FAQs</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="header-cta" href={contact.whatsapp} target="_blank" rel="noreferrer">Get in touch <Arrow /></a>
      </header>

      <nav className="mobile-nav" aria-label="Section navigation">
        <a href="#services">Services</a>
        <a href="#pricing">Pricing</a>
        <a href="#gallery">Gallery</a>
        <a href="#about">About</a>
        <a href="#faqs">FAQs</a>
        <a href="#contact">Contact</a>
      </nav>

      <section className="hero" id="home" aria-labelledby="hero-title">
        <div className="hero-image-wrap">
          <Image src="/images/hero-porsche-front.webp" alt="Blue Porsche viewed from the front three-quarter angle" fill priority sizes="100vw" className="hero-image" />
        </div>
        <div className="hero-shade" />
        <div className="hero-copy">
          <Image className="hero-logo" src="/images/gb-logo-2026.webp" alt="GB Detailing" width={200} height={98} priority />
          <p className="eyebrow"><span className="eyebrow-line" /> MOBILE CAR CARE · CAMBRIDGESHIRE</p>
          <h1 id="hero-title">A higher standard<br />of <em>car care.</em></h1>
          <p className="hero-text">Welcome to GB Detailing. Thoughtful valeting and paint care, delivered with a careful hand and an eye for every detail.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#services">Explore our services <span aria-hidden="true">↓</span></a>
            <a className="text-link" href={contact.whatsapp} target="_blank" rel="noreferrer">Talk to us <Arrow /></a>
          </div>
          <div className="hero-proof">
            <span className="proof-mark">✦</span>
            <span><strong>Carefully considered</strong><small>Time and attention in every visit</small></span>
            <span className="proof-divider" />
            <span className="proof-mark">⌖</span>
            <span><strong>Locally based</strong><small>Cambridgeshire and nearby</small></span>
          </div>
        </div>
        <div className="hero-image-caption"><span>GB DETAILING · CAMBRIDGESHIRE</span><span>AN EYE FOR EVERY DETAIL</span></div>
        <a className="hero-scroll" href="#services">DISCOVER MORE <span aria-hidden="true">↓</span></a>
      </section>

      <div className="ticker" aria-label="Service categories">
        <div className="ticker-track">
          <span>VALETING</span><b>✧</b><span>PAINT PROTECTION</span><b>✧</b><span>DETAILING EXTRAS</span><b>✧</b><span>CARE IN EVERY DETAIL</span><b>✧</b>
          <span>VALETING</span><b>✧</b><span>PAINT PROTECTION</span><b>✧</b><span>DETAILING EXTRAS</span><b>✧</b>
        </div>
      </div>

      <section className="section services-section" id="services">
        <div className="section-heading">
          <div><p className="eyebrow">01 / THE SERVICES</p><h2>Care that suits<br /><em>your car.</em></h2></div>
          <p className="section-intro">From a thoughtful valet to focused paint care, explore the services available and find the right starting point for your vehicle.</p>
        </div>
        <div className="service-grid">
          {services.map((category, index) => (
            <a className={`service-tile${index === 2 ? " service-tile-featured" : ""}`} href={`#${category.id}`} key={category.id}>
              <span className="service-number">0{index + 1}</span>
              <span className="service-orbit" aria-hidden="true">{["↗", "◌", "✧"][index]}</span>
              <h3>{category.title}</h3>
              <p>{category.intro}</p>
              <span className="service-tile-link">Explore {category.title} <Arrow /></span>
            </a>
          ))}
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="section pricing-inner">
          <div className="section-heading pricing-heading">
            <div><p className="eyebrow">02 / THE PRICE GUIDE</p><h2>Clear starting prices.<br /><em>Considered care.</em></h2></div>
            <p className="section-intro">Prices start with a small vehicle. Medium and large vehicle adjustments are shown below; condition and extra work may affect your final quote.</p>
          </div>

          <div className="pricing-categories">
            {services.map((category, index) => (
              <section className="price-category" id={category.id} key={category.id} aria-labelledby={`${category.id}-title`}>
                <div className="price-category-heading">
                  <span className="package-number">0{index + 1}</span>
                  <div><h3 id={`${category.id}-title`}>{category.title}</h3><p>{category.intro}</p></div>
                </div>
                <ul className="price-list">
                  {category.items.map(([name, price]) => (
                    <li className="price-row" key={name}>
                      <span>{name}</span><span className="price-dots" aria-hidden="true" /><strong>{price}</strong>
                    </li>
                  ))}
                </ul>
                <a className="category-cta" href={`${contact.whatsapp}?text=${encodeURIComponent(`Hi GB Detailing, I'd like to ask about ${category.title.toLowerCase()}.`)}`} target="_blank" rel="noreferrer">Ask about {category.title} <Arrow /></a>
              </section>
            ))}
          </div>

          <div className="size-adjustments" aria-labelledby="size-title">
            <div className="size-heading"><p className="eyebrow">VEHICLE SIZE</p><h3 id="size-title">A simple size guide</h3></div>
            <div className="size-grid">
              <div><span>SMALL</span><strong>Included</strong></div>
              <div><span>MEDIUM</span><strong>+£5</strong></div>
              <div><span>LARGE</span><strong>+£10</strong></div>
            </div>
          </div>
          <p className="pricing-note">Starting prices may vary with vehicle condition and work required. Any changes are discussed and agreed with you before work begins. An End of Lease / Full Valet can take up to five hours.</p>
        </div>
      </section>

      <GalleryCarousel />

      <section className="section about-section" id="about">
        <div className="about-photo">
          <Image src="/images/gallery-wheel-detail.webp" alt="Close detail of a blue car’s wheel and fender badge" fill sizes="(max-width: 760px) 90vw, 48vw" />
          <span className="photo-label">AN EYE FOR THE DETAILS</span>
        </div>
        <div className="about-copy">
          <p className="eyebrow">04 / ABOUT GB DETAILING</p>
          <h2>Care, craft<br />and <em>character.</em></h2>
          <p>GB Detailing is built around a simple idea: take your time, pay attention and treat every vehicle with respect. From everyday valeting to focused paint care, each visit is approached with care and clear communication.</p>
          <p>Mobile service is available across Ramsey, Huntingdon, St Ives, Peterborough, Cambridge and surrounding areas.</p>
          <div className="values-list">
            <div><span>01</span><strong>Careful by design</strong><small>Time and attention in every detail.</small></div>
            <div><span>02</span><strong>Clear from the start</strong><small>Discuss the work and price before we begin.</small></div>
            <div><span>03</span><strong>Local and personal</strong><small>Speak directly with GB Detailing.</small></div>
          </div>
          <a className="button button-outline" href={contact.whatsapp} target="_blank" rel="noreferrer">Get in touch <Arrow /></a>
        </div>
      </section>

      <section className="faq-section" id="faqs">
        <div className="section faq-inner">
          <div className="faq-heading"><p className="eyebrow">05 / GOOD TO KNOW</p><h2>Questions?<br /><em>Answered.</em></h2><p>Need a hand choosing a service? Get in touch and we’ll talk through what your car needs.</p><a className="text-link" href={contact.whatsapp} target="_blank" rel="noreferrer">Ask us directly <Arrow /></a></div>
          <div className="faq-list">
            {faqs.map((faq) => <details className="faq-item" key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}
          </div>
        </div>
      </section>

      <section className="contact-banner" id="contact">
        <div><p className="eyebrow">06 / CONTACT</p><h2>Let’s give your car<br /><em>the care it deserves.</em></h2><p>Call or WhatsApp to ask about services or request a quote.</p></div>
        <div className="contact-actions"><a className="button button-light" href={contact.whatsapp} target="_blank" rel="noreferrer">WhatsApp GB Detailing <Arrow /></a><a className="contact-phone" href={contact.phoneHref}>{contact.phone}</a></div>
        <div className="banner-mark" aria-hidden="true">GB<span>.</span></div>
      </section>

      <footer className="site-footer">
        <div className="footer-top">
          <a className="brand footer-brand" href="#home" aria-label="GB Detailing home"><Image src="/images/gb-logo-2026.webp" alt="GB Detailing" width={200} height={98} /></a>
          <p>Mobile car care<br />Ramsey · Huntingdon · St Ives<br />Peterborough · Cambridge & nearby</p>
          <div className="social-links"><a href={contact.facebook} target="_blank" rel="noreferrer">Facebook <Arrow /></a><a href={contact.instagram} target="_blank" rel="noreferrer">Instagram <Arrow /></a><a href={contact.tiktok} target="_blank" rel="noreferrer">TikTok <Arrow /></a></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} GB Detailing</span><span>BUILT ON THE DETAILS.</span><a href={contact.whatsapp} target="_blank" rel="noreferrer">Contact us</a></div>
      </footer>
      <a className="mobile-sticky-cta" href={contact.whatsapp} target="_blank" rel="noreferrer">WhatsApp for a quote <Arrow /></a>
    </main>
  );
}
