import React, { useState, useRef, useEffect } from "react";

// Icons
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
    />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 12.75l6 6 9-13.5"
    />
  </svg>
);

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  description?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outlined" | "filled";
  rainbowRing?: boolean;
  rainbowBorder?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  icon,
  disabled = false,
  className = "",
  buttonClassName = "",
  size = "md",
  variant = "outlined",
  rainbowRing = false,
  rainbowBorder = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case "Escape":
        setIsOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const currentIndex = options.findIndex((opt) => opt.value === value);
          const nextIndex =
            currentIndex < options.length - 1 ? currentIndex + 1 : 0;
          onChange(options[nextIndex].value);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) {
          const currentIndex = options.findIndex((opt) => opt.value === value);
          const prevIndex =
            currentIndex > 0 ? currentIndex - 1 : options.length - 1;
          onChange(options[prevIndex].value);
        }
        break;
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: "min-h-[34px] text-xs px-2.5 py-1.5",
    md: "min-h-[42px] text-sm px-3 py-2",
    lg: "min-h-[50px] text-base px-4 py-2.5",
  };

  const variantClasses = {
    default: `
      bg-white border border-gray-200
      hover:border-[#256ff1]/60 hover:bg-gray-50
      focus:border-[#256ff1] focus:ring-1 focus:ring-[#256ff1]
    `,
    outlined: `
      bg-white border border-gray-300
      hover:border-[#256ff1]/60
      focus:border-[#256ff1] focus:ring-1 focus:ring-[#256ff1]
    `,
    filled: `
      bg-gray-100 border border-transparent
      hover:bg-gray-200
      focus:bg-white focus:border-[#256ff1] focus:ring-1 focus:ring-[#256ff1]
    `,
  };

  const buttonJSX = (
    <button
      type="button"
      onClick={() => !disabled && setIsOpen(!isOpen)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={`
        relative flex items-center justify-between gap-2 w-full rounded-xl
        font-medium transition-all duration-200 outline-none
        ${sizeClasses[size]}
        ${rainbowBorder ? "border-transparent bg-transparent shadow-none" : variantClasses[variant]}
        ${isOpen && !rainbowBorder ? "ring-2 ring-primary bg-white" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer"}
        ${buttonClassName}
      `}
      style={rainbowBorder ? { border: "none", background: "transparent" } : {}}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {rainbowRing && !value ? (
          <span className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center">
            <span className="rainbow-orbit-ring" />
          </span>
        ) : (
          <>
            {icon && (
              <span className="flex-shrink-0 w-4 h-4 text-gray-400">
                {icon}
              </span>
            )}
            {selectedOption?.icon && !icon && (
              <span className="flex-shrink-0 w-4 h-4">{selectedOption.icon}</span>
            )}
          </>
        )}
        <span
          className={`truncate ${selectedOption ? "text-gray-900" : "text-gray-400"}`}
        >
          {selectedOption?.label || placeholder}
        </span>
      </div>
      <ChevronDownIcon
        className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
      />
    </button>
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <style>{`
        @keyframes rainbow-orbit-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .rainbow-orbit-ring {
          position: relative;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          padding: 1px;
          background: conic-gradient(#256ff1, #ea4335, #fbbc05, #34a853, #256ff1);
          -webkit-mask: radial-gradient(farthest-side, transparent 55%, black 60%);
          mask: radial-gradient(farthest-side, transparent 55%, black 60%);
          animation: rainbow-orbit-spin 1.2s linear infinite;
        }

        @keyframes border-rainbow-spin {
          100% { transform: rotate(360deg); }
        }
        .rainbow-btn-wrapper {
          position: relative;
          z-index: 0;
          border-radius: 12px;
          padding: 1.5px;
          background: transparent;
          overflow: hidden;
          width: 100%;
        }
        .rainbow-btn-wrapper::before {
          content: '';
          position: absolute;
          z-index: -2;
          left: 50%;
          top: 50%;
          width: 400px;
          height: 400px;
          margin-left: -200px;
          margin-top: -200px;
          background: conic-gradient(#256ff1, #ea4335, #fbbc05, #34a853, #256ff1);
          animation: border-rainbow-spin 3s linear infinite;
        }
        .rainbow-btn-wrapper::after {
          content: '';
          position: absolute;
          z-index: -1;
          left: 1.5px;
          top: 1.5px;
          right: 1.5px;
          bottom: 1.5px;
          background: white;
          border-radius: 11px;
        }
      `}</style>

      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}

      {rainbowBorder ? (
        <div className="rainbow-btn-wrapper">
          {buttonJSX}
        </div>
      ) : (
        buttonJSX
      )}

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          role="listbox"
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                    ${
                      isSelected
                        ? "bg-[#256ff1]/5 text-[#256ff1]"
                        : "text-gray-700 hover:bg-gray-50"
                    }
                  `}
                  role="option"
                  aria-selected={isSelected}
                >
                  {option.icon && (
                    <span
                      className={`flex-shrink-0 w-5 h-5 ${isSelected ? "text-[#256ff1]" : "text-gray-400"}`}
                    >
                      {option.icon}
                    </span>
                  )}
                  {option.color && (
                    <span
                      className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span
                      className={`block truncate ${size === "sm" ? "text-xs" : "text-sm"} font-medium`}
                    >
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="block text-xs text-gray-500 truncate mt-0.5">
                        {option.description}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <CheckIcon className="w-4 h-4 text-[#256ff1] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
