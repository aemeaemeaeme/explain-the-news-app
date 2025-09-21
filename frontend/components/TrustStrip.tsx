export default function TrustStrip() {
  const outlets = [
    { name: "CNN", logo: "CNN" },
    { name: "Reuters", logo: "Reuters" },
    { name: "BBC", logo: "BBC" },
    { name: "AP", logo: "AP" },
    { name: "NPR", logo: "NPR" },
    { name: "The Guardian", logo: "Guardian" }
  ];

  return (
    <section className="py-16 px-4 bg-[#F7F5F2]">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-lg text-gray-600 mb-8 font-['Inter',system-ui,sans-serif]">
          As seen on
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {outlets.map((outlet) => (
            <div
              key={outlet.name}
              className="flex items-center justify-center h-12 px-6 bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <span className="text-xl font-semibold text-gray-400 font-['Inter',system-ui,sans-serif]">
                {outlet.logo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}