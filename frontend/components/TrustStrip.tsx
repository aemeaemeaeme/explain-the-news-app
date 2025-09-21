export default function TrustStrip() {
  const outlets = [
    { name: "CNN", logo: "CNN" },
    { name: "Reuters", logo: "Reuters" },
    { name: "BBC", logo: "BBC" },
    { name: "Associated Press", logo: "AP" },
    { name: "NPR", logo: "NPR" },
    { name: "The Guardian", logo: "The Guardian" }
  ];

  const avatars = [
    { name: "User 1" },
    { name: "User 2" },
    { name: "User 3" },
  ];

  return (
    <>
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-gray-600 mb-6 uppercase tracking-wide">
            As featured by
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
            {outlets.map((outlet) => (
              <div
                key={outlet.name}
                className="flex items-center justify-center h-12 px-6 bg-[#A3B18A]/10 rounded-xl border border-[#A3B18A]/20"
              >
                <span className="text-base font-semibold text-[#0B1B2B]">
                  {outlet.logo}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-8 px-4 bg-[#F7F7F7]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex -space-x-2">
              {avatars.map((user, index) => (
                <div
                  key={index}
                  className="w-8 h-8 bg-[#8FA573] rounded-full border-2 border-white flex items-center justify-center"
                >
                  <span className="text-white text-xs font-semibold">
                    {user.name.charAt(0)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-gray-600">
              Trusted by 50,000+ readers
            </p>
          </div>
        </div>
      </section>
    </>
  );
}