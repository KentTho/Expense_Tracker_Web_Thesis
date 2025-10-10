import logo from "../assets/logo.png";

export default function AuthLayout({ children, rightContent }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <div className="w-[90%] max-w-7xl grid md:grid-cols-2 gap-8">
        {/* LEFT SIDE */}
        <div className="flex flex-col justify-center items-center relative p-8">
          {/* Logo top-left */}
          <div className="absolute top-6 left-8">
            <img src={logo} alt="App Logo" className="h-20 w-auto" />
          </div>

          {/* Centered content (Login / Register form) */}
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* RIGHT SIDE */}
        <div className="bg-purple-50 rounded-3xl shadow-inner flex items-center justify-center px-8 py-6 h-screen">
          <div className="w-[95%] ml-auto h-full justify-center max-w-2xl">{rightContent}</div>
        </div>
      </div>
    </div>
  );
}
