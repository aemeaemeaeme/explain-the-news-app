import { Cpu, Scale, MessagesSquare, Clock3, Shield, Globe2 } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Cpu,
      title: "AI-Powered Analysis",
      description: "Advanced language models provide nuanced understanding of complex news stories with contextual analysis.",
      bgColor: "bg-[#D9EAF7]",
      iconColor: "text-[#0B1B2B]"
    },
    {
      icon: Scale,
      title: "Bias Detection",
      description: "Multi-pass analysis identifies political lean and confidence levels with transparent rationale for every assessment.",
      bgColor: "bg-[#A3B18A]/10",
      iconColor: "text-[#8FA573]"
    },
    {
      icon: MessagesSquare,
      title: "Multiple Perspectives",
      description: "See how different stakeholders view the same story, helping you understand the full spectrum of opinions.",
      bgColor: "bg-[#FFE8D6]",
      iconColor: "text-[#0B1B2B]"
    },
    {
      icon: Clock3,
      title: "Save Time",
      description: "Get comprehensive understanding in seconds instead of spending minutes reading multiple sources.",
      bgColor: "bg-[#D9EAF7]",
      iconColor: "text-[#0B1B2B]"
    },
    {
      icon: Shield,
      title: "Privacy Focused",
      description: "All analyses auto-delete after 24 hours. No tracking, no permanent storage, no user accounts required.",
      bgColor: "bg-[#A3B18A]/10",
      iconColor: "text-[#8FA573]"
    },
    {
      icon: Globe2,
      title: "Works Everywhere",
      description: "Compatible with most major news sites and publications. Simply paste any article URL to get started.",
      bgColor: "bg-[#FFE8D6]",
      iconColor: "text-[#0B1B2B]"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0B1B2B] mb-6">
            Everything You Need
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive news analysis tools designed for the modern information landscape
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-6`}>
                <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
              </div>
              <h3 className="text-xl font-semibold text-[#0B1B2B] mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}