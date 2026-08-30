import Image from "next/image";
import Link from "next/link";
import { LookbookItem } from "@/types";
import { ArrowRight } from "lucide-react";

interface LookbookBlockProps {
  items: LookbookItem[];
}

export default function LookbookBlock({ items }: LookbookBlockProps) {
  if (!items || items.length < 3) return null;

  const [leadItem, itemTwo, itemThree] = items;

  return (
    <section className="py-10 sm:py-16 bg-bg-subtle border-y border-line-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-accent-gold block">
            CURATED COLLECTION
          </span>
          <h2 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold tracking-[0.08em] uppercase text-ink-900 mt-1">
            FEATURED LOOKBOOK
          </h2>
        </div>

        {/* Clean 3-Up Grid with crisp, fully visible photography */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          {/* Large Lead Look (Left 7 cols) */}
          <Link
            href={leadItem.link}
            className="md:col-span-7 group relative rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-line-200 shadow-xs hover:shadow-md transition-all block"
          >
            <div className="relative aspect-[4/3] sm:aspect-[16/10] md:min-h-[420px] w-full overflow-hidden bg-bg-subtle">
              <Image
                src={leadItem.imageUrl}
                alt={leadItem.title}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            <div className="p-4 sm:p-5 flex items-center justify-between bg-white border-t border-line-100">
              <div>
                <h3 className="font-heading text-sm sm:text-base font-bold uppercase tracking-wider text-ink-900">
                  {leadItem.title}
                </h3>
                {leadItem.subtitle && (
                  <p className="text-xs text-ink-500 mt-0.5 font-light">
                    {leadItem.subtitle}
                  </p>
                )}
              </div>
              <span className="text-xs font-bold uppercase text-ink-900 group-hover:text-accent-red flex items-center gap-1">
                Shop Look <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* Stacked 2 Looks (Right 5 cols) */}
          <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-5">
            {[itemTwo, itemThree].map((item, idx) => (
              <Link
                key={item.id || idx}
                href={item.link}
                className="group relative rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-line-200 shadow-xs hover:shadow-md transition-all block"
              >
                <div className="relative aspect-[16/10] md:h-[160px] w-full overflow-hidden bg-bg-subtle">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="p-3.5 flex items-center justify-between bg-white border-t border-line-100">
                  <div>
                    <h3 className="font-heading text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-900">
                      {item.title}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold uppercase text-ink-900 group-hover:text-accent-red flex items-center gap-1">
                    Explore <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
