import React from 'react';

export const CustomLoader = ({ className = "", size = "default" }) => {
  // Size variants
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };

  const sizeClass = sizeClasses[size] || sizeClasses.default;

  return (
    <div className={`relative inline-block ${sizeClass} ${className}`}>
      <svg
        className="animate-spin"
        viewBox="0 0 50 50"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        {/* Generate 12 radial lines with varying opacity */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30) - 90; // 360/12 = 30 degrees each, start from top
          const opacity = 0.2 + (i / 12) * 0.8; // Gradient from 0.2 to 1.0
          
          return (
            <rect
              key={i}
              x="23"
              y="6"
              width="4"
              height="12"
              rx="2"
              opacity={opacity}
              transform={`rotate(${angle} 25 25)`}
            />
          );
        })}
      </svg>
    </div>
  );
};
