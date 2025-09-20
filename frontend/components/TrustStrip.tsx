export default function TrustStrip() {
  const partners = [
    "CNN", "Reuters", "BBC", "Associated Press", "NPR", "The Guardian"
  ];

  return (
    <section className="py-12 px-4 border-y border-gray-200 bg-white/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">
            Works with articles from
          </p>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {partners.map((partner, index) => (
            <div 
              key={index}
              className="text-gray-400 font-semibold text-lg opacity-60 hover:opacity-80 transition-opacity"
            >
              {partner}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
