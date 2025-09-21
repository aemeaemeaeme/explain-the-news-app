export default function Testimonials() {
  const testimonials = [
    {
      quote: "Finally, a tool that helps me understand bias in news without having to read multiple sources. The ELI5 explanations are perfect for complex political stories.",
      author: "Sarah Chen",
      role: "Policy Researcher"
    },
    {
      quote: "The perspective analysis is incredibly valuable. It shows me viewpoints I wouldn't have considered and helps me form more balanced opinions.",
      author: "Marcus Rodriguez", 
      role: "Graduate Student"
    },
    {
      quote: "As a busy professional, I love how quickly I can get the gist of major news stories. The bias analysis helps me stay objective in discussions.",
      author: "Dr. Emily Watson",
      role: "Healthcare Administrator"
    }
  ];

  return (
    <section className="py-20 px-4 bg-[#F7F5F2]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-['Inter',system-ui,sans-serif]">
            What Our Users Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-['Inter',system-ui,sans-serif]">
            Join thousands who rely on our analysis for better news understanding
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="mb-6">
                <div className="flex text-[#A3B18A] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L0 6.91l6.561-.954L10 0l3.439 5.956L20 6.91l-5.245 4.635 1.123 6.545z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed font-['Inter',system-ui,sans-serif]">
                  "{testimonial.quote}"
                </p>
              </div>
              <div className="border-t border-gray-100 pt-6">
                <p className="font-semibold text-gray-900 font-['Inter',system-ui,sans-serif]">
                  {testimonial.author}
                </p>
                <p className="text-gray-600 text-sm font-['Inter',system-ui,sans-serif]">
                  {testimonial.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}