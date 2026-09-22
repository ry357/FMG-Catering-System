import { CONTACT_INFO } from '../../data/landingData';
import SectionHeading from '../ui/SectionHeading';

const contactItems = [
  {
    label: 'Address',
    value: CONTACT_INFO.address,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    label: 'Phone',
    value: CONTACT_INFO.phone,
    href: `tel:${CONTACT_INFO.phone.replace(/\s/g, '')}`,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    value: CONTACT_INFO.email,
    href: `mailto:${CONTACT_INFO.email}`,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    label: 'Business Hours',
    value: CONTACT_INFO.hours,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    value: `@${CONTACT_INFO.instagram}`,
    href: `https://instagram.com/${CONTACT_INFO.instagram}`,
    icon: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 1.802c-3.15 0-3.522.011-4.767.068-2.431.111-3.557 1.26-3.667 3.666-.057 1.244-.068 1.616-.068 4.767 0 3.15.011 3.522.068 4.767.11 2.404 1.233 3.556 3.667 3.667 1.244.056 1.616.067 4.767.067 3.15 0 3.522-.011 4.767-.067 2.431-.111 3.557-1.26 3.667-3.667.056-1.244.067-1.616.067-4.767 0-3.15-.011-3.522-.067-4.767-.11-2.404-1.233-3.556-3.667-3.666-1.244-.057-1.616-.068-4.767-.068zm0 3.063a5.972 5.972 0 100 11.944 5.972 5.972 0 000-11.944zm0 9.853a3.881 3.881 0 110-7.762 3.881 3.881 0 010 7.762zm6.25-10.12a1.395 1.395 0 11-2.79 0 1.395 1.395 0 012.79 0z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export default function Contact() {
  return (
    <section id="contact" className="section-padding bg-white">
      <div className="section-container">
        <SectionHeading
          label="Contact"
          title="Get in Touch"
          description="Questions? Message us and we will respond promptly."
        />

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="grid sm:grid-cols-2 gap-6">
            {contactItems.map((item) => (
              <div
                key={item.label}
                className="bg-gold-50/80 rounded-2xl p-6 border border-gold-100"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500 text-charcoal">
                  {item.icon}
                </div>
                <h3 className="mt-4 font-semibold text-charcoal">{item.label}</h3>
                {item.href ? (
                  <a
                    href={item.href}
                    className="mt-2 text-sm text-charcoal-muted hover:text-gold-600 transition-colors block"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-charcoal-muted">{item.value}</p>
                )}
              </div>
            ))}
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-card h-64 lg:h-full min-h-[300px]">
            <iframe
              title="FMG Catering Services location map"
              src="https://maps.google.com/maps?q=Ibabao%2C+Perrelos%2C+Carcar%2C+Cebu+Philippines&output=embed"
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
