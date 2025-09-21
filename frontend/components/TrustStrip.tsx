export default function TrustStrip() {
  const outlets = [
    { name: "CNN", logo: "CNN" },
    { name: "Reuters", logo: "Reuters" },
    { name: "BBC", logo: "BBC" },
    { name: "Associated Press", logo: "Associated Press" },
    { name: "NPR", logo: "NPR" },
    { name: "The Guardian", logo: "The Guardian" }
  ];

  return (
    <section className="py-16 px-4 bg-[#F7F7F7]">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-lg text-gray-600 mb-8 font-['Inter',system-ui,sans-serif]">
          As featured in
        </p>
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
          {outlets.map((outlet) => (
            <div
              key={outlet.name}
              className="flex items-center justify-center h-14 px-6 bg-[#E6F0FF] rounded-2xl shadow-sm border border-[#5C8CF0]/20"
            >
              <span className="text-lg font-semibold text-[#2C3E50] font-['Inter',system-ui,sans-serif]">
                {outlet.logo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}