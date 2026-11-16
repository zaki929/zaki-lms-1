import Image from "next/image";
import { BRAND } from "@/lib/brand";

/**
 * Logo sekolah.
 *
 * Logo asli didominasi kuning terang dan berlatar transparan. Kalau diletakkan
 * langsung, ia terlihat seperti gumpalan kuning yang melayang — terutama di
 * atas header putih. Di dalam kotak putih membulat dengan border tipis, ia
 * terbaca sebagai lambang resmi dan menyatu dengan sidebar gelap maupun
 * header terang tanpa perlu mengubah palet UI.
 */
export function SchoolLogo({
  size = 44,
  className = "",
  priority = false,
}: {
  /** Panjang sisi kotak dalam pixel. */
  size?: number;
  /** Kelas tambahan pada elemen <img>. */
  className?: string;
  /** true untuk logo di atas layar (LCP) supaya tidak lazy-load. */
  priority?: boolean;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-900/10 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={BRAND.logo}
        alt={`Logo ${BRAND.schoolName}`}
        width={size}
        height={size}
        priority={priority}
        className="h-full w-full object-contain p-[12%]"
      />
    </span>
  );
}