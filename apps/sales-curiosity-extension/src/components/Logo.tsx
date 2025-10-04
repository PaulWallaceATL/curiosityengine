import React from "react";

interface LogoProps {
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ size = 40 }) => {
  return (
    <div style={{
      width: size,
      height: size,
      position: "relative",
      display: "inline-block",
      borderRadius: size / 4
    }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`logoGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id={`sparkGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle cx="64" cy="64" r="62" fill={`url(#logoGradient-${size})`} />
        
        {/* SC letters */}
        <text
          x="64"
          y="82"
          fontSize="56"
          fontWeight="700"
          fill="white"
          textAnchor="middle"
          fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif"
        >
          SC
        </text>
        
        {/* Sparkle accent */}
        <circle cx="98" cy="30" r="5" fill={`url(#sparkGradient-${size})`} />
        <path
          d="M 98 22 L 98 38 M 90 30 L 106 30"
          stroke={`url(#sparkGradient-${size})`}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        
        {/* AI indicator dots */}
        <circle cx="50" cy="102" r="3" fill="white" opacity="0.8" />
        <circle cx="64" cy="102" r="3" fill="white" opacity="0.8" />
        <circle cx="78" cy="102" r="3" fill="white" opacity="0.8" />
      </svg>
    </div>
  );
};

export const LogoSmall: React.FC<{ size?: number }> = ({ size = 20 }) => {
  return <Logo size={size} />;
};

