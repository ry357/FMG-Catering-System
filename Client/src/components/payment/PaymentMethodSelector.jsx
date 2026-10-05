import { Link } from 'react-router-dom';

export default function PaymentMethodSelector({ selected, onSelect, gcashEnabled, stripeEnabled }) {
  const methods = [
    {
      id: 'gcash',
      name: 'GCash',
      badge: 'e-Wallet',
      badgeColor: 'bg-blue-100 text-blue-700',
      description: 'Pay via GCash mobile wallet (Philippines)',
      enabled: gcashEnabled,
      missingNotice: 'Set PAYMONGO_SECRET_KEY in server/.env',
      icon: (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#007DFE] text-white font-bold text-sm shadow-sm">
          GC
        </div>
      ),
    },
    {
      id: 'card',
      name: 'Credit / Debit Card',
      badge: 'via Stripe',
      badgeColor: 'bg-indigo-100 text-indigo-700',
      description: 'Pay securely using Visa, Mastercard, AMEX, or JCB',
      enabled: stripeEnabled,
      missingNotice: 'Set STRIPE_SECRET_KEY in server/.env',
      icon: (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#635BFF] text-white shadow-sm">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" />
            <line x1="2" y1="10" x2="22" y2="10" strokeWidth="2" />
          </svg>
        </div>
      ),
      extraBadges: ['Visa', 'Mastercard', 'AMEX'],
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-charcoal">Select payment method</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            disabled={!method.enabled}
            onClick={() => method.enabled && onSelect(method.id)}
            className={`relative rounded-xl border-2 p-4 text-left transition-all ${
              selected === method.id
                ? 'border-gold-500 ring-2 ring-gold-500/30 bg-gold-50/20 shadow-md'
                : 'border-gray-200 hover:border-gold-300 bg-white'
            } ${!method.enabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}`}
          >
            <div className="flex items-start gap-3">
              {method.icon}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-charcoal text-sm">{method.name}</p>
                  {method.badge && (
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${method.badgeColor}`}>
                      {method.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-charcoal-muted mt-1 leading-relaxed">{method.description}</p>
                {method.extraBadges && (
                  <div className="mt-2 flex items-center gap-1.5">
                    {method.extraBadges.map((brand) => (
                      <span key={brand} className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                        {brand}
                      </span>
                    ))}
                  </div>
                )}
                {!method.enabled && (
                  <p className="text-[11px] text-amber-700 font-medium mt-2 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    Not configured ({method.missingNotice})
                  </p>
                )}
              </div>
            </div>
            {selected === method.id && (
              <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-charcoal shadow-sm">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PaymentSetupNotice() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      <p className="font-semibold">Payment setup required</p>
      <p className="mt-2">
        Configure GCash (<code className="font-mono bg-amber-100 px-1 rounded">PAYMONGO_SECRET_KEY</code>) or Stripe (<code className="font-mono bg-amber-100 px-1 rounded">STRIPE_SECRET_KEY</code>) credentials to enable live payments. See{' '}
        <code className="font-mono bg-amber-100 px-1 rounded">server/.env.example</code>.
      </p>
      <Link to="/" className="inline-block mt-3 text-gold-700 font-medium hover:underline">
        Back to home
      </Link>
    </div>
  );
}
