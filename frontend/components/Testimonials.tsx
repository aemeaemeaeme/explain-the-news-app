const testimonials = [
  {
    quote: "Finally, I can understand complex news without spending hours reading. The bias analysis is incredibly helpful.",
    author: "Sarah Chen",
    title: "Journalist"
  },
  {
    quote: "Perfect for my daily news briefing. The ELI5 summaries help me explain current events to my students.",
    author: "Michael Rodriguez",
    title: "Teacher"
  },
  {
    quote: "Love how it shows different perspectives. Helps me stay informed without getting stuck in echo chambers.",
    author: "Emma Thompson",
    title: "Policy Analyst"
  }
];

export default function Testimonials() {
  return (
    <section className="py-20 px-4 bg-white/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            What Our Users Say
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <div className="mb-6">
                <div className="text-3xl text-[#A3B18A] mb-4">"</div>
                <p className="text-gray-700 leading-relaxed">
                  {testimonial.quote}
                </p>
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {testimonial.author}
                </div>
                <div className="text-sm text-gray-500">
                  {testimonial.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
