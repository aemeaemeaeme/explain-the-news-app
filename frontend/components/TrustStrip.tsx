export default function TrustStrip() {
  const institutions = [
    { name: "Harvard University", logo: "Harvard" },
    { name: "University of Oregon", logo: "Univ. of Oregon" },
    { name: "University of Leeds", logo: "Univ. of Leeds" },
    { name: "Ateneo de Manila", logo: "Ateneo de Manila" },
    { name: "Columbia University", logo: "Columbia" },
    { name: "Stanford University", logo: "Stanford" }
  ];

  const avatars = [
    { name: "Sarah M", initials: "SM" },
    { name: "David L", initials: "DL" },
    { name: "Maria G", initials: "MG" },
    { name: "John K", initials: "JK" },
    { name: "Lisa W", initials: "LW" },
  ];

  return (
    <>
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-gray-600 mb-6 uppercase tracking-wide">
            Supporting readers at top institutions
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
            {institutions.map((institution) => (
              <div
                key={institution.name}
                className="flex items-center justify-center h-10 px-4 rounded-lg border"
                style={{backgroundColor: 'var(--sage)', borderColor: 'var(--sage-dark)', color: 'var(--navy)'}}
              >
                <span className="text-sm font-medium">
                  {institution.logo}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-12 px-4 bg-[#F7F7F7]">
        <div className="max-w-4xl mx-auto text-center">
          <div 
            className="rounded-2xl p-8 card-shadow bg-gradient-to-br from-white to-gray-50"
          >
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="flex -space-x-2">
                {avatars.map((user, index) => (
                  <div
                    key={index}
                    className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center"
                    style={{backgroundColor: 'var(--olive)'}}
                  >
                    <span className="text-white text-xs font-semibold">
                      {user.initials}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{color: 'var(--navy)'}}>
              Trusted by 100,000+ readers
            </h3>
            <p className="text-gray-600">
              Students, researchers, and professionals rely on Unspin for balanced news analysis
            </p>
          </div>
        </div>
      </section>
    </>
  );
}