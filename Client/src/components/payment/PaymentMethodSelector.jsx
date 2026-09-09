import { Link } from 'react-router-dom';

export default function PaymentMethodSelector({ selected, onSelect, gcashEnabled }) {
  const methods = [
    {
      id: 'gcash',
      name: 'GCash',
      description: 'Pay via GCash mobile wallet (Philippines)',
      enabled: gcashEnabled,
      color: 'border-blue-300 bg-blue-50',
      icon: (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#007DFE] text-white font-bold text-xs">
          GC
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-charcoal">Select payment method</p>
      <div className="grid sm:grid-cols-1 gap-3">
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            disabled={!method.enabled}
            onClick={() => method.enabled && onSelect(method.id)}
            className={`relative rounded-xl border-2 p-4 text-left transition-all ${
              selected === method.id
                ? 'border-gold-400 ring-2 ring-gold-400/30 shadow-md'
                : 'border-gray-200 hover:border-gold-200'
            } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-start gap-3">
              {method.icon}
              <div>
                <p className="font-semibold text-charcoal">{method.name}</p>
                <p className="text-xs text-charcoal-muted mt-1">{method.description}</p>
                {!method.enabled && (
                  <p className="text-xs text-amber-600 mt-2">Not configured — see .env setup</p>
                )}
              </div>
            </div>
            {selected === method.id && (
              <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-gold-400 text-white">
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
        Configure GCash credentials to enable live payments. See{' '}
        <code className="font-mono bg-amber-100 px-1 rounded">server/.env.example</code>.
      </p>
      <Link to="/" className="inline-block mt-3 text-gold-700 font-medium hover:underline">
        Back to home
      </Link>
    </div>
  );
}
