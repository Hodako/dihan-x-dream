import { Truck, Banknote, RefreshCw, Globe } from "lucide-react";

export default function TrustRow() {
  const trustFeatures = [
    {
      icon: Truck,
      title: "Nationwide Shipping",
      description: "Fast doorstep delivery across all 64 districts",
    },
    {
      icon: Banknote,
      title: "Cash on Delivery",
      description: "Pay with cash upon arrival or partial advance",
    },
    {
      icon: RefreshCw,
      title: "Easy 7-Day Exchange",
      description: "Hassle-free size or product exchange policy",
    },
    {
      icon: Globe,
      title: "100% Authentic Quality",
      description: "Premium curated fabrics and modern tailoring",
    },
  ];

  return (
    <section className="border-y border-line-100 bg-bg-subtle py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustFeatures.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start space-x-4">
                <div className="p-3 bg-white border border-line-100 flex-shrink-0 text-ink-900">
                  <Icon className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-900">
                    {item.title}
                  </h4>
                  <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
