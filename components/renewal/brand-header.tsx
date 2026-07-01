import Image from "next/image";

// Intrinsic logo dimensions (875×224). The image is a wide horizontal
// wordmark that already contains the "CivilEzy" text, so the <h1> carries
// the brand name for screen readers while the image is the visual cue.
const LOGO_W = 875;
const LOGO_H = 224;

export function BrandHeader() {
  return (
    <header className="flex flex-col items-center gap-3 px-4 pt-12 pb-8 text-center sm:pt-16 sm:pb-10 lg:pt-20 lg:pb-12">
      {/* Logo — responsive height, width derived from aspect ratio */}
      <div className="relative h-12 w-[187px] sm:h-14 sm:w-[219px] lg:h-16 lg:w-[250px]">
        <Image
          src="/civilezy_logo_orange.png"
          alt="CivilEzy — By Wincentre"
          fill
          sizes="(max-width: 640px) 187px, (max-width: 1024px) 219px, 250px"
          className="object-contain"
          priority
          quality={90}
          // Provide explicit dimensions for static analysis; fill overrides them.
          width={LOGO_W}
          height={LOGO_H}
        />
      </div>

      {/* Brand name — visually reinforces the logo wordmark for screen readers */}
      <div className="flex flex-col items-center gap-0.5">
        <h1 className="sr-only">CivilEzy</h1>

        <p className="text-sm font-medium tracking-widest text-orange-500 uppercase sm:text-base">
          Renewal Portal
        </p>
      </div>

      {/* Optional tagline */}
      <p className="text-muted-foreground max-w-xs text-sm sm:max-w-sm sm:text-base">
        Renew your Civilezy subscription quickly and securely.
      </p>
    </header>
  );
}
