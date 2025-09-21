export default function TrustStrip() {
  const institutions = [
    { name: "Harvard University", logo: "Harvard" },
    { name: "University of Oregon", logo: "Univ. of Oregon" },
    { name: "University of Leeds", logo: "Univ. of Leeds" },
    { name: "Ateneo de Manila", logo: "Ateneo de Manila" },
    { name: "Columbia University", logo: "Columbia" },
    { name: "Stanford University", logo: "Stanford" }
  ];

  // Real avatar images for social proof
  const avatars = [
    { name: "Sarah M", src: "https://images.unsplash.com/photo-1494790108755-2616b612b48c?w=100&h=100&fit=crop&crop=face" },
    { name: "David L", src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" },
    { name: "Maria G", src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face" },
    { name: "John K", src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face" },
    { name: "Lisa W", src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" },
    { name: "Alex R", src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" },
    { name: "Emma T", src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face" },
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
                className="flex items-center justify-center h-12 px-4 rounded-lg card-shadow"
                style={{backgroundColor: 'var(--mint)', color: 'var(--ink)'}}
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
                  <img
                    key={index}
                    src={user.src}
                    alt={user.name}
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                    onError={(e) => {
                      // Fallback to colored circle with initials
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = document.createElement('div');
                      fallback.className = 'w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold';
                      fallback.style.backgroundColor = 'var(--sage)';
                      fallback.textContent = user.name.split(' ').map(n => n[0]).join('');
                      target.parentNode?.insertBefore(fallback, target);
                    }}
                  />
                ))}
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{color: 'var(--ink)'}}>
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