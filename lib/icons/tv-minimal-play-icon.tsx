import Svg, { Path, Rect } from 'react-native-svg';

const COLORS = {
  light: '#615fff',
  dark: '#a78bfa',
} as const;

interface TvMinimalPlayIconProps {
  size?: number;
  variant?: keyof typeof COLORS;
  color?: string;
}

export function TvMinimalPlayIcon({ size = 24, variant = 'light', color }: TvMinimalPlayIconProps) {
  const stroke = color ?? COLORS[variant];

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M15.033 9.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56V7.648a.645.645 0 0 1 .967-.56z" />
      <Path d="M7 21h10" />
      <Rect width={20} height={14} x={2} y={3} rx={2} />
    </Svg>
  );
}
