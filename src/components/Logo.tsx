import logo from "@/assets/logo.png";

export const Logo = ({ className = "h-10 w-10" }: { className?: string }) => (
  <img src={logo} alt="NearbyPro logo" className={`${className} rounded-xl object-contain`} loading="eager" />
);
