import utilitiesIcon from '../assets/utilities.svg';

// Икони-картинки: стойността в category.icon е 'svg:<име>'
const SVG_ICONS: Record<string, string> = {
  utilities: utilitiesIcon,
};

// Текстов заместител за места, където картинка не може да се покаже (<option>)
const TEXT_FALLBACK: Record<string, string> = {
  utilities: '🧾',
};

export function iconText(icon: string): string {
  if (icon.startsWith('svg:')) return TEXT_FALLBACK[icon.slice(4)] ?? '📦';
  return icon;
}

export default function CategoryIcon({ icon, size = 17 }: { icon: string; size?: number }) {
  if (icon.startsWith('svg:')) {
    const src = SVG_ICONS[icon.slice(4)];
    if (src)
      return (
        <img
          src={src}
          width={size}
          height={size}
          alt=""
          style={{ verticalAlign: '-3px', display: 'inline-block' }}
        />
      );
    return <>{iconText(icon)}</>;
  }
  return <>{icon}</>;
}
